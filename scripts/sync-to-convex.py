#!/usr/bin/env python3
"""Sync Garmin, TES, and weed data to Convex."""

import os
import json
import hashlib
import argparse
import urllib.request
from datetime import datetime, timedelta

CONVEX_URL = os.environ.get(
    "CONVEX_URL", "https://giant-eel-625.eu-west-1.convex.cloud"
)
API_BRIDGE_URL = os.environ.get("API_BRIDGE_URL", "http://api-bridge:8080")
API_BRIDGE_TOKEN = os.environ.get("API_BRIDGE_TOKEN", "")
WORKSPACE = os.path.expanduser("~/.openclaw/workspace")
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STATE_PATH = os.path.join(WORKSPACE, "data", "mc_sync_state.json")


def convex_mutation(fn_name: str, args: dict):
    url = f"{CONVEX_URL}/api/mutation"
    payload = json.dumps({"path": fn_name, "args": args, "format": "json"}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            if result.get("status") == "error":
                print(
                    f"  ⚠ Convex error for {fn_name}: {result.get('errorMessage', '')[:100]}"
                )
            return result
    except Exception as e:
        print(f"  ⚠ Failed {fn_name}: {e}")
        return None


def fetch_api_bridge(path: str):
    url = f"{API_BRIDGE_URL}{path}"
    req = urllib.request.Request(url, headers={"X-API-Bridge-Token": API_BRIDGE_TOKEN})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  ⚠ API Bridge error {path}: {e}")
        return None


def _load_state():
    if os.path.exists(STATE_PATH):
        try:
            with open(STATE_PATH) as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_state(state: dict):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    tmp = f"{STATE_PATH}.tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_PATH)


def _hash_obj(obj) -> str:
    raw = json.dumps(obj, sort_keys=True, default=str).encode()
    return hashlib.sha256(raw).hexdigest()


def _file_sig(path: str):
    try:
        st = os.stat(path)
        return {"mtime": int(st.st_mtime), "size": st.st_size}
    except Exception:
        return None


def _changed(state: dict, key: str, sig) -> bool:
    if state.get(key) == sig:
        return False
    state[key] = sig
    return True


def sync_health(state: dict):
    """Sync Garmin health data — today + 7 day history."""
    print("📊 Syncing health data...")

    today = fetch_api_bridge("/garmin/today")
    last_sync = (today or {}).get("last_sync")
    if last_sync and not _changed(state, "health", {"garmin_last_sync": last_sync}):
        print("  ↩ Garmin unchanged — skipping")
        return

    # Fetch 7-day data (dict with daily[], sleep[], hrv[], training_readiness etc)
    data = fetch_api_bridge("/garmin/data?days=7")
    if not data or not isinstance(data, dict):
        print("  ⚠ No garmin data returned")
        return

    daily_list = data.get("daily", [])
    sleep_list = data.get("sleep", [])
    hrv_list = data.get("hrv", [])
    tr_list = data.get("training_readiness", [])

    # Index sleep/hrv/tr by date for easy lookup
    sleep_by_date = {}
    for s in sleep_list:
        dto = s.get("dailySleepDTO", {})
        d = dto.get("calendarDate")
        if d:
            secs = dto.get("sleepTimeSeconds", 0) or 0
            sleep_by_date[d] = {
                "hours": round(secs / 3600, 1),
                "score": dto.get("sleepScores", {}).get("overall", {}).get("value"),
            }

    hrv_by_date = {}
    for h in hrv_list:
        s = h.get("hrvSummary", {})
        d = s.get("calendarDate")
        if d:
            hrv_by_date[d] = s.get("lastNightAvg")

    tr_by_date = {}
    if isinstance(tr_list, list):
        for t in tr_list:
            d = t.get("calendarDate")
            if d:
                tr_by_date[d] = t.get("score")
    elif isinstance(tr_list, dict):
        d = tr_list.get("calendarDate")
        if d:
            tr_by_date[d] = tr_list.get("score")

    # Collect all known dates from all sources
    daily_by_date = {}
    for day in daily_list:
        d = day.get("calendarDate")
        if d:
            daily_by_date[d] = day

    all_dates = sorted(
        set(
            list(daily_by_date.keys())
            + list(hrv_by_date.keys())
            + list(sleep_by_date.keys())
            + list(tr_by_date.keys())
        )
    )

    count = 0
    for date in all_dates:
        day = daily_by_date.get(date, {})
        sleep = sleep_by_date.get(date, {})
        args = {
            "date": date,
            "hrv": hrv_by_date.get(date),
            "sleepScore": sleep.get("score"),
            "sleepHours": sleep.get("hours"),
            "stress": day.get("averageStressLevel"),
            "bodyBattery": day.get("bodyBatteryHighestValue")
            or day.get("bodyBatteryMostRecentValue"),
            "bodyBatteryHigh": day.get("bodyBatteryHighestValue"),
            "bodyBatteryLow": day.get("bodyBatteryLowestValue"),
            "restingHR": day.get("restingHeartRate"),
            "steps": day.get("totalSteps"),
            "activeCalories": day.get("activeKilocalories"),
            "trainingReadiness": tr_by_date.get(date),
        }
        args = {k: v for k, v in args.items() if v is not None}
        if "date" in args:
            convex_mutation("health:upsertHealth", args)
            count += 1

    print(f"  ✓ Synced {count} daily snapshots")

    # Also fetch today's live data
    if today:
        daily = today.get("daily", {})
        sleep_dto = today.get("sleep", {}).get("dailySleepDTO", {})
        hrv_s = today.get("hrv", {}).get("hrvSummary", {})
        tr = today.get("training_readiness", {})

        sleep_secs = sleep_dto.get("sleepTimeSeconds", 0) or 0
        args = {
            "date": today.get("date", datetime.now().strftime("%Y-%m-%d")),
            "hrv": hrv_s.get("lastNightAvg"),
            "sleepScore": sleep_dto.get("sleepScores", {})
            .get("overall", {})
            .get("value"),
            "sleepHours": round(sleep_secs / 3600, 1) if sleep_secs else None,
            "stress": daily.get("averageStressLevel"),
            "bodyBattery": daily.get("bodyBatteryHighestValue")
            or daily.get("bodyBatteryMostRecentValue"),
            "bodyBatteryHigh": daily.get("bodyBatteryHighestValue"),
            "bodyBatteryLow": daily.get("bodyBatteryLowestValue"),
            "restingHR": daily.get("restingHeartRate"),
            "steps": daily.get("totalSteps"),
            "activeCalories": daily.get("activeKilocalories"),
            "trainingReadiness": tr.get("score") if isinstance(tr, dict) else None,
        }
        args = {k: v for k, v in args.items() if v is not None}
        convex_mutation("health:upsertHealth", args)
        print(
            f"  ✓ Today: HRV={args.get('hrv')}, Sleep={args.get('sleepScore')}, BB={args.get('bodyBattery')}, TR={args.get('trainingReadiness')}"
        )


def sync_tes(state: dict):
    print("🧬 Syncing TES character...")
    import sqlite3

    db_path = f"{WORKSPACE}/data/quark.db"
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return

    sig = _file_sig(db_path)
    if sig and not _changed(state, "tes", sig):
        print("  ↩ TES unchanged — skipping")
        return

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Read character table (key/value)
    char_rows = db.execute("SELECT key, value FROM character").fetchall()
    char = {r["key"]: r["value"] for r in char_rows}

    # Try to parse JSON values
    for k, v in char.items():
        try:
            char[k] = json.loads(v)
        except (json.JSONDecodeError, TypeError):
            pass

    total_events = db.execute("SELECT COUNT(*) FROM xp_log").fetchone()[0]

    args = {
        "level": char.get("overall_level", 1),
        "xp": char.get("total_xp", 0),
        "totalXp": char.get("total_xp", 0),
        "streaks": char.get("streaks", {}),
        "badges": char.get("badges_earned", []),
        "domains": char.get("domains", {}),
        "className": char.get("class", "The Regulated Architect"),
        "totalEvents": total_events,
    }
    # Ensure numeric types
    if isinstance(args["level"], str):
        try:
            args["level"] = int(args["level"])
        except ValueError:
            args["level"] = 1
    if isinstance(args["xp"], str):
        try:
            args["xp"] = int(args["xp"])
            args["totalXp"] = args["xp"]
        except ValueError:
            args["xp"] = 0
            args["totalXp"] = 0

    convex_mutation("tes:upsertTes", args)
    print(
        f"  ✓ Level {args['level']}, XP {args['xp']}, {len(args.get('badges', []))} badges"
    )
    db.close()


def sync_weed(state: dict):
    print("🌿 Syncing weed tracker...")
    import sqlite3

    db_path = f"{WORKSPACE}/data/quark.db"
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return

    sig = _file_sig(db_path)
    if sig and not _changed(state, "weed", sig):
        print("  ↩ Weed unchanged — skipping")
        return

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    current_year = now.strftime("%Y")

    # Get stats from weed_log
    monthly_use = db.execute(
        "SELECT COUNT(*) FROM weed_log WHERE used = 1 AND date LIKE ?",
        (f"{current_month}%",),
    ).fetchone()[0]

    yearly_use = db.execute(
        "SELECT COUNT(*) FROM weed_log WHERE used = 1 AND date LIKE ?",
        (f"{current_year}%",),
    ).fetchone()[0]

    # Last use date
    last_use_row = db.execute(
        "SELECT date FROM weed_log WHERE used = 1 ORDER BY date DESC LIMIT 1"
    ).fetchone()
    last_use_date = last_use_row["date"] if last_use_row else now.strftime("%Y-%m-%d")

    # Current clean streak (days since last use)
    try:
        last_use = datetime.strptime(last_use_date, "%Y-%m-%d")
        current_streak = (now - last_use).days
    except ValueError:
        current_streak = 0

    args = {
        "currentStreak": current_streak,
        "lastUseDate": last_use_date,
        "monthlyUseDays": monthly_use,
        "monthlyGoal": 8,
        "yearlyUseDays": yearly_use,
        "yearlyGoal": 96,
    }
    convex_mutation("ziolo:upsertZiolo", args)
    print(
        f"  ✓ Streak: {current_streak}d, Monthly: {monthly_use}/8, Yearly: {yearly_use}/96"
    )
    db.close()


def sync_trading(state: dict):
    """Sync trading strategies from quantbox-live repo."""
    import re
    import subprocess

    print("📈 Syncing trading strategies...")
    repo = os.path.expanduser("~/.openclaw/repos/quantbox-live")
    if not os.path.isdir(repo):
        print("  ⚠ quantbox-live repo not found")
        return

    def _git_rev(ref: str) -> str:
        r = subprocess.run(
            ["git", "-C", repo, "rev-parse", ref],
            capture_output=True,
            text=True,
        )
        return r.stdout.strip() if r.returncode == 0 else ""

    revs = {
        "main": _git_rev("origin/main"),
        "binance": _git_rev("origin/quantlab-binance"),
        "paper": _git_rev("origin/paper"),
    }
    if any(revs.values()) and not _changed(state, "trading", revs):
        print("  ↩ Trading unchanged — skipping")
        return

    strategies = []

    # --- 1. Main branch: Carver Trend v1 (Hyperliquid) ---
    try:
        # Find latest report
        reports_dir = os.path.join(repo, "reports")
        if os.path.isdir(reports_dir):
            files = sorted(
                [
                    f
                    for f in os.listdir(reports_dir)
                    if f.endswith(".md") and not f.endswith("_paper.md")
                ]
            )
            if files:
                report_path = os.path.join(reports_dir, files[-1])
                report_date = files[-1].replace(".md", "")
                with open(report_path) as f:
                    md = f.read()

                def extract_val(pattern, text, as_float=True):
                    m = re.search(pattern, text)
                    if m:
                        v = (
                            m.group(1)
                            .replace(",", "")
                            .replace("$", "")
                            .replace("+", "")
                            .replace("%", "")
                            .strip()
                        )
                        if v == "—" or v == "":
                            return None
                        return float(v) if as_float else v
                    return None

                equity = extract_val(r"Portfolio \(post\)\s*\|\s*\$?([\d,.]+)", md)
                pnl_match = re.search(r"PnL\s*\|\s*\$?([-\d,.]+)\s*\(([-+\d.]+)%\)", md)
                pnl = float(pnl_match.group(1).replace(",", "")) if pnl_match else None
                pnl_pct = float(pnl_match.group(2)) if pnl_match else None
                net_exp = extract_val(
                    r"Net exposure\s*\|\s*([-+\d.%]+)", md, as_float=False
                )
                positions = extract_val(r"Positions\s*\|\s*(\d+)", md)

                r1d = extract_val(r"1 Day\s*\|\s*([-+\d.]+)%", md)
                r7d = extract_val(r"7 Day\s*\|\s*([-+\d.]+)%", md)
                r30d = extract_val(r"30 Day\s*\|\s*([-+\d.]+)%", md)
                ritd = extract_val(r"Inception\s*\|\s*([-+\d.]+)%", md)

                sharpe = extract_val(r"Sharpe\s*\|\s*([-\d.]+)", md)
                max_dd = extract_val(r"Max Drawdown\s*\|\s*([-\d.]+)%", md)
                win_rate = extract_val(r"Win Rate\s*\|\s*([\d.]+)%", md)

                # Parse equity curve
                eq_curve = []
                for line in md.split("\n"):
                    m = re.match(r"\s+(\d{4}-\d{2}-\d{2})\s+\|+\s+\$?([\d,.]+)", line)
                    if m:
                        eq_curve.append(
                            {
                                "date": m.group(1),
                                "value": float(m.group(2).replace(",", "")),
                            }
                        )

                # Parse position breakdown table
                # | Symbol | Target Wt | Actual Wt | Drift | Notional | Unrealized PnL |
                pos_breakdown = []
                in_pos_table = False
                for line in md.split("\n"):
                    if "Position Reconciliation" in line or (
                        "Symbol" in line and "Target Wt" in line
                    ):
                        in_pos_table = True
                        continue
                    if in_pos_table:
                        # skip header separator
                        if re.match(r"^\|[\s:|-]+\|", line):
                            continue
                        # stop at next section
                        if line.startswith("#") or (
                            line.strip() and not line.startswith("|")
                        ):
                            break
                        pos_m = re.match(
                            r"\|\s*([A-Z]+)\s*\|\s*([-+\d.]+)%\s*\|\s*([-+\d.]+)%\s*\|\s*([-+\d.]+)%\s*\|\s*\$?([-\d,.]+)\s*\|\s*\$?([-\d,.]+)\s*\|",
                            line,
                        )
                        if pos_m:
                            actual_wt = float(pos_m.group(3))
                            pos_breakdown.append(
                                {
                                    "symbol": pos_m.group(1),
                                    "targetWt": float(pos_m.group(2)),
                                    "actualWt": actual_wt,
                                    "drift": float(pos_m.group(4)),
                                    "notional": float(pos_m.group(5).replace(",", "")),
                                    "unrealizedPnl": float(
                                        pos_m.group(6).replace(",", "")
                                    ),
                                    "side": "short"
                                    if actual_wt < 0
                                    else "long"
                                    if actual_wt > 0
                                    else "flat",
                                }
                            )

                strategies.append(
                    {
                        "strategyId": "carver_trend_v1",
                        "name": "Carver Trend v1",
                        "mode": "live",
                        "exchange": "Hyperliquid",
                        "equity": equity,
                        "pnl": pnl,
                        "pnlPct": pnl_pct,
                        "return1d": r1d,
                        "return7d": r7d,
                        "return30d": r30d,
                        "returnItd": ritd,
                        "sharpe": sharpe,
                        "maxDrawdown": abs(max_dd) if max_dd else None,
                        "winRate": win_rate,
                        "positions": positions,
                        "netExposure": str(net_exp) if net_exp else None,
                        "equityCurve": eq_curve if eq_curve else None,
                        "positionBreakdown": pos_breakdown if pos_breakdown else None,
                        "reportDate": report_date,
                    }
                )
                print(
                    f"  ✓ Carver Trend v1: ${equity}, Sharpe {sharpe}, {len(pos_breakdown)} positions"
                )
    except Exception as e:
        print(f"  ⚠ Main branch parse error: {e}")

    # --- 2. quantlab-binance branch: CryptoTrend + Momentum (Binance) ---
    try:
        result = subprocess.run(
            [
                "git",
                "-C",
                repo,
                "show",
                "origin/quantlab-binance:performance/artifacts/",
            ],
            capture_output=True,
            text=True,
        )
        # Find latest date folder
        if result.returncode == 0:
            # List performance artifacts via git ls-tree
            ls = subprocess.run(
                [
                    "git",
                    "-C",
                    repo,
                    "ls-tree",
                    "-r",
                    "--name-only",
                    "origin/quantlab-binance",
                    "performance/artifacts/",
                ],
                capture_output=True,
                text=True,
            )
            artifact_files = [
                l for l in ls.stdout.strip().split("\n") if l.endswith("artifact.json")
            ]
            if artifact_files:
                # Build equity curve from all daily artifacts (dedupe by date, take last per day)
                eq_by_date = {}
                for af in sorted(artifact_files):
                    try:
                        raw_af = subprocess.run(
                            [
                                "git",
                                "-C",
                                repo,
                                "show",
                                f"origin/quantlab-binance:{af}",
                            ],
                            capture_output=True,
                            text=True,
                        )
                        if raw_af.returncode == 0:
                            ad = json.loads(raw_af.stdout)
                            rd_af = ad.get("report_date", "")
                            pv = ad.get("payload", {}).get("portfolio_value")
                            if rd_af and pv:
                                eq_by_date[rd_af] = pv
                    except Exception:
                        pass

                eq_curve = [
                    {"date": dt, "value": v} for dt, v in sorted(eq_by_date.items())
                ]

                latest = sorted(artifact_files)[-1]
                raw = subprocess.run(
                    ["git", "-C", repo, "show", f"origin/quantlab-binance:{latest}"],
                    capture_output=True,
                    text=True,
                )
                if raw.returncode == 0:
                    data = json.loads(raw.stdout)
                    p = data.get("payload", {})
                    periods = p.get("periods", {})
                    risk = p.get("risk", {}).get("portfolio", {})
                    rd = data.get("report_date", "")

                    strategies.append(
                        {
                            "strategyId": "binance_crypto_trend",
                            "name": "CryptoTrend + Momentum",
                            "mode": "live",
                            "exchange": "Binance",
                            "equity": p.get("portfolio_value"),
                            "pnl": periods.get("CTD", {}).get("pnl_usdc"),
                            "pnlPct": periods.get("CTD", {}).get("pnl_pct"),
                            "return1d": periods.get("1D", {}).get("twr_pct"),
                            "return7d": periods.get("7D", {}).get("twr_pct"),
                            "return30d": periods.get("30D", {}).get("twr_pct"),
                            "returnItd": periods.get("CTD", {}).get("twr_pct"),
                            "sharpe": risk.get("sharpe_ratio"),
                            "maxDrawdown": abs(risk.get("max_drawdown", 0))
                            if risk.get("max_drawdown")
                            else None,
                            "winRate": None,
                            "positions": len(
                                p.get("asset_allocation", {}).get("holdings", [])
                            ),
                            "netExposure": f"{p.get('asset_allocation', {}).get('invested_pct', 0)}%",
                            "reportDate": rd,
                            "equityCurve": eq_curve if len(eq_curve) > 1 else None,
                        }
                    )
                    print(
                        f"  ✓ Binance CryptoTrend: ${p.get('portfolio_value')} ({len(eq_curve)} equity points)"
                    )
    except Exception as e:
        print(f"  ⚠ Binance branch parse error: {e}")

    # --- 3. Paper branch: 5 paper strategies (from JSON performance files) ---
    try:
        ls = subprocess.run(
            [
                "git",
                "-C",
                repo,
                "ls-tree",
                "-r",
                "--name-only",
                "origin/paper",
                "reports/",
            ],
            capture_output=True,
            text=True,
        )
        # Find latest report directory with JSON performance files
        json_files = sorted(
            [
                l
                for l in ls.stdout.strip().split("\n")
                if l.endswith(".json") and "performance_" in l
            ]
        )
        if json_files:
            # Group by date directory
            latest_date = json_files[-1].split("/")[
                1
            ]  # reports/YYYY-MM-DD/performance_*.json
            latest_jsons = [f for f in json_files if f"/{latest_date}/" in f]

            for jf in latest_jsons:
                raw = subprocess.run(
                    ["git", "-C", repo, "show", f"origin/paper:{jf}"],
                    capture_output=True,
                    text=True,
                )
                if raw.returncode != 0:
                    continue
                try:
                    d = json.loads(raw.stdout)
                except Exception:
                    continue

                # Extract strategy id from filename: performance_carver_trend_n10.json -> carver_trend_n10
                fname = (
                    jf.split("/")[-1].replace("performance_", "").replace(".json", "")
                )
                sid = fname

                periods = d.get("periods", {})
                risk = d.get("risk_metrics", {})
                eq_curve = d.get("equity_curve", [])

                # Build equity curve for chart
                chart_data = None
                if eq_curve and len(eq_curve) > 1:
                    chart_data = [
                        {"date": p["date"], "value": p["equity"]} for p in eq_curve
                    ]

                s_data = {
                    "strategyId": f"paper_{sid}",
                    "name": sid.replace("_", " ").title(),
                    "mode": "paper",
                    "exchange": "Paper",
                    "equity": d.get("equity_usdc"),
                    "pnl": d.get("cumulative_pnl_usdc"),
                    "pnlPct": (d.get("cumulative_pnl_usdc", 0) / 10000 * 100)
                    if d.get("cumulative_pnl_usdc")
                    else None,
                    "reportDate": latest_date,
                    "return1d": periods.get("1D", {}).get("return_pct"),
                    "return7d": periods.get("7D", {}).get("return_pct"),
                    "return30d": periods.get("30D", {}).get("return_pct"),
                    "returnItd": periods.get("ITD", {}).get("return_pct"),
                    "sharpe": risk.get("sharpe"),
                    "maxDrawdown": abs(risk.get("max_drawdown", 0)) * 100
                    if risk.get("max_drawdown")
                    else None,
                    "winRate": risk.get("win_rate", 0) * 100
                    if risk.get("win_rate")
                    else None,
                    "equityCurve": chart_data,
                }
                strategies.append(s_data)

            print(
                f"  ✓ Parsed {len([s for s in strategies if s['mode'] == 'paper'])} paper strategies from JSON"
            )

        # Fallback: parse markdown if no JSON found
        if not any(s["mode"] == "paper" for s in strategies):
            paper_files = sorted(
                [l for l in ls.stdout.strip().split("\n") if l.endswith("_paper.md")]
            )
            if paper_files:
                latest = paper_files[-1]
                raw = subprocess.run(
                    ["git", "-C", repo, "show", f"origin/paper:{latest}"],
                    capture_output=True,
                    text=True,
                )
                if raw.returncode == 0:
                    md = raw.stdout
                    report_date = latest.split("/")[-1].replace("_paper.md", "")
                    for row in re.finditer(
                        r"\|\s*(\w+)\s*\|\s*\$?([\d,.]+)\s*\|",
                        md.split("## Strategy Comparison")[1].split("##")[0]
                        if "## Strategy Comparison" in md
                        else "",
                    ):
                        sid = row.group(1)
                        eq = float(row.group(2).replace(",", ""))
                        strategies.append(
                            {
                                "strategyId": f"paper_{sid}",
                                "name": sid.replace("_", " ").title(),
                                "mode": "paper",
                                "exchange": "Paper",
                                "equity": eq,
                                "reportDate": report_date,
                            }
                        )
                    print(
                        f"  ✓ Parsed {len([s for s in strategies if s['mode'] == 'paper'])} paper strategies from MD fallback"
                    )
    except Exception as e:
        print(f"  ⚠ Paper branch parse error: {e}")

    # Push to Convex
    for s in strategies:
        # Remove None values
        args = {k: v for k, v in s.items() if v is not None}
        convex_mutation("trading:upsertStrategy", args)

    print(f"  ✓ Synced {len(strategies)} strategies total")


def sync_trade_log(state: dict):
    """Sync trade fills from Hyperliquid report directories."""
    print("📜 Syncing trade log...")
    reports_dir = os.path.expanduser("~/.openclaw/repos/quantbox-live/reports")
    if not os.path.isdir(reports_dir):
        print("  ⚠ No reports dir")
        return

    # Collect trade_history.json from last 14 days of report dirs
    trades_synced = 0
    for d in sorted(os.listdir(reports_dir)):
        dir_path = os.path.join(reports_dir, d)
        if not os.path.isdir(dir_path):
            continue
        th_path = os.path.join(dir_path, "trade_history.json")
        if not os.path.isfile(th_path):
            continue
        try:
            with open(th_path) as f:
                data = json.load(f)
            ts = data.get("timestamp", f"{d}T00:00:00Z")
            trades = data.get("trades", [])
            for t in trades:
                if t.get("status") != "FILLED":
                    continue
                qty = t.get("quantity", 0)
                price = t.get("executed_price", 0)
                convex_mutation(
                    "trading:upsertTrade",
                    {
                        "strategyId": "carver_trend_v1",
                        "date": d,
                        "timestamp": ts,
                        "symbol": t.get("symbol", "?"),
                        "side": t.get("action", "?"),
                        "quantity": float(qty),
                        "price": float(price),
                        "notional": round(float(qty) * float(price), 2),
                        "fee": float(t.get("fee", 0)),
                        "status": "FILLED",
                    },
                )
                trades_synced += 1
        except Exception as e:
            print(f"  ⚠ Error parsing {d}: {e}")

    print(f"  ✓ Synced {trades_synced} filled trades")


def sync_meal_log(state: dict):
    """Sync logged meals from SQLite meals.db."""
    import sqlite3

    print("📋 Syncing meal log...")

    db_path = f"{WORKSPACE}/data/quark.db"
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return
    sig = _file_sig(db_path)
    if sig and not _changed(state, "meal_log", sig):
        print("  ↩ Meal log unchanged — skipping")
        return

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Sync last 7 days
    cutoff = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    rows = db.execute(
        "SELECT * FROM meals WHERE date >= ? ORDER BY date, meal_type", (cutoff,)
    ).fetchall()

    # Group by date
    by_date = {}
    for r in rows:
        d = r["date"]
        if d not in by_date:
            by_date[d] = []
        by_date[d].append(
            {
                "mealType": r["meal_type"],
                "name": r["name"],
                "kcal": r["kcal"] or 0,
                "protein": r["protein"] or 0,
                "carbs": r["carbs"] or 0,
                "fat": r["fat"] or 0,
                "satFat": r["sat_fat"] or 0,
                "fiber": r["fiber"] or 0,
            }
        )

    count = 0
    for date, meals in by_date.items():
        convex_mutation("meals:syncMealLog", {"date": date, "meals": meals})
        count += len(meals)

    print(f"  ✓ Synced {count} logged meals across {len(by_date)} days")
    db.close()


def _parse_weekly_plan_lines(lines):
    import re

    days = []
    current_day = None
    summary_lines = []
    in_summary = False

    for line in lines:
        day_match = re.match(
            r"^## ((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\\s+\\d+\\s+\\w+.*?)$",
            line,
        )
        if day_match:
            if current_day:
                days.append(current_day)
            day_title = day_match.group(1).strip()
            is_fish = "🐟" in day_title
            current_day = {
                "day": re.sub(r"\\s*🐟.*", "", day_title),
                "isFish": is_fish,
                "meals": [],
                "totalKcal": 0,
                "totalProtein": 0,
                "totalCarbs": 0,
                "totalFat": 0,
                "note": None,
            }
            in_summary = False
            continue

        if line.startswith("## 📊") or line.startswith("## Weekly"):
            if current_day:
                days.append(current_day)
                current_day = None
            in_summary = True
            continue

        if in_summary:
            summary_lines.append(line)
            continue

        if not current_day:
            continue

        total_match = re.match(
            r"✅\\s*Daily Total:\\s*([\\d,]+)\\s*kcal\\s*\\|\\s*C:\\s*(\\d+)g\\s*\\|\\s*P:\\s*(\\d+)g\\s*\\|\\s*F:\\s*(\\d+)g",
            line,
        )
        if total_match:
            current_day["totalKcal"] = int(total_match.group(1).replace(",", ""))
            current_day["totalCarbs"] = int(total_match.group(2))
            current_day["totalProtein"] = int(total_match.group(3))
            current_day["totalFat"] = int(total_match.group(4))
            sat_match = re.search(r"Sat fat:\\s*(\\d+)g", line)
            if sat_match:
                current_day["satFat"] = int(sat_match.group(1))
            continue

        if line.startswith("⚠️"):
            current_day["note"] = line.replace("⚠️", "").strip()
            continue

        meal_match = re.match(
            r"^(?:Breakfast|Lunch|Dinner|Snack|Evening|Flat White|Post-workout)(?:\\s*—\\s*(.+))?",
            line,
        )
        if meal_match:
            meal_name = line.split("—")[0].strip() if "—" in line else line.strip()
            meal_desc = meal_match.group(1) or ""
            current_day["_current_meal"] = {
                "name": meal_name,
                "items": meal_desc,
                "kcal": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
            }
            continue

        macro_match = re.search(
            r"(\\d+)\\s*kcal\\s*\\|\\s*(?:C:\\s*)?(\\d+)g\\s*\\|\\s*(?:P:\\s*)?(\\d+)g\\s*\\|\\s*(?:F:\\s*)?(\\d+)g",
            line,
        )
        if macro_match and "_current_meal" in current_day:
            m = current_day.pop("_current_meal")
            m["kcal"] = int(macro_match.group(1))
            m["carbs"] = int(macro_match.group(2))
            m["protein"] = int(macro_match.group(3))
            m["fat"] = int(macro_match.group(4))
            current_day["meals"].append(m)
            continue
        elif macro_match:
            name = line.split("—")[0].strip() if "—" in line else "Extra"
            current_day["meals"].append(
                {
                    "name": name,
                    "items": "",
                    "kcal": int(macro_match.group(1)),
                    "carbs": int(macro_match.group(2)),
                    "protein": int(macro_match.group(3)),
                    "fat": int(macro_match.group(4)),
                }
            )
            continue

        if (
            "_current_meal" in current_day
            and line.strip()
            and not line.startswith("##")
        ):
            current_day["_current_meal"]["items"] = line.strip()

    if current_day:
        days.append(current_day)

    for d in days:
        d.pop("_current_meal", None)
        if d.get("note") is None:
            d.pop("note", None)
        if d.get("satFat") is None:
            d.pop("satFat", None)

    return days, summary_lines


def sync_meals(state: dict):
    """Sync weekly meal plan from quark.db (chef plan)."""
    import sqlite3

    print("🍽️ Syncing meal plan...")
    db_path = f"{WORKSPACE}/data/quark.db"
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    row = db.execute(
        "SELECT week_start, plan, summary FROM weekly_plans "
        "WHERE domain='chef' ORDER BY week_start DESC LIMIT 1"
    ).fetchone()
    db.close()

    if not row:
        print("  ↩ No chef plan in quark.db")
        return

    week_start = row["week_start"]
    summary = row["summary"] or None
    sig = _hash_obj(f"{week_start}:{row['plan']}")
    if sig and not _changed(state, "meal_plan", sig):
        print("  ↩ Meal plan unchanged — skipping")
        return

    try:
        plan = json.loads(row["plan"])
    except (json.JSONDecodeError, TypeError):
        print("  ⚠ Invalid plan JSON in quark.db")
        return

    DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    days = []
    for day_key in DAY_ORDER:
        day_data = plan.get(day_key)
        if not day_data:
            continue
        totals = day_data.get("totals", {})
        meals = []
        for m in day_data.get("meals", []):
            meal_entry = {
                "name": m.get("type", "meal").capitalize(),
                "items": m.get("name", ""),
                "kcal": int(m.get("kcal", 0)),
                "protein": int(m.get("protein", 0)),
                "carbs": int(m.get("carbs", 0)),
                "fat": int(m.get("fat", 0)),
            }
            meals.append(meal_entry)
        day_entry = {
            "day": day_key,
            "meals": meals,
            "totalKcal": int(totals.get("kcal", 0)),
            "totalProtein": int(totals.get("protein", 0)),
            "totalCarbs": int(totals.get("carbs", 0)),
            "totalFat": int(totals.get("fat", 0)),
        }
        if totals.get("sat_fat") is not None:
            day_entry["satFat"] = int(totals["sat_fat"])
        days.append(day_entry)

    if not days:
        print("  ⚠ No days parsed from plan")
        return

    args = {"weekLabel": week_start, "days": days}
    if summary:
        args["summary"] = summary

    convex_mutation("meals:upsertMealPlan", args)
    print(
        f"  ✓ Chef plan {week_start}: {len(days)} days, {sum(len(d['meals']) for d in days)} meals"
    )


def sync_chef_daily_brief(state: dict):
    """Sync today's adjusted Chef brief to Convex dailyAdjustedMeals."""
    import sqlite3

    print("⚡ Syncing Chef daily brief...")
    db_path = f"{WORKSPACE}/data/quark.db"
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return

    today = datetime.now().strftime("%Y-%m-%d")

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    exists = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_briefs'"
    ).fetchone()
    if not exists:
        db.close()
        print("  ↩ daily_briefs table not found")
        return

    row = db.execute(
        "SELECT plan_today, adjustment FROM daily_briefs WHERE domain='chef' AND date=?",
        (today,),
    ).fetchone()
    db.close()

    if not row or not row["plan_today"]:
        print(f"  ↩ No chef brief for {today}")
        return

    sig = _hash_obj(f"chef_brief:{today}:{row['plan_today']}")
    if not _changed(state, "chef_daily_brief", sig):
        print("  ↩ Chef brief unchanged — skipping")
        return

    try:
        plan_today = json.loads(row["plan_today"])
    except (json.JSONDecodeError, TypeError):
        print("  ⚠ Invalid plan_today JSON in chef brief")
        return

    # Parse adjustment reason
    adj_reason = None
    is_adjusted = False
    if row["adjustment"]:
        try:
            adj = json.loads(row["adjustment"])
            if isinstance(adj, dict):
                adj_reason = adj.get("reason") or adj.get("description")
                is_adjusted = bool(adj_reason)
            elif isinstance(adj, str) and adj.strip():
                adj_reason = adj.strip()
                is_adjusted = True
        except Exception:
            pass

    meals_raw = plan_today.get("meals", [])
    totals = plan_today.get("totals", {})

    meals = []
    for m in meals_raw:
        meals.append(
            {
                "name": m.get("type", "meal").capitalize(),
                "items": m.get("name", ""),
                "kcal": int(m.get("kcal", 0)),
                "protein": int(m.get("protein", 0)),
                "carbs": int(m.get("carbs", 0)),
                "fat": int(m.get("fat", 0)),
            }
        )

    if not meals:
        print("  ↩ No meals in chef brief")
        return

    args = {
        "date": today,
        "domain": "chef",
        "meals": meals,
        "totalKcal": int(totals.get("kcal", sum(m["kcal"] for m in meals))),
        "totalProtein": int(totals.get("protein", sum(m["protein"] for m in meals))),
        "totalCarbs": int(totals.get("carbs", sum(m["carbs"] for m in meals))),
        "totalFat": int(totals.get("fat", sum(m["fat"] for m in meals))),
    }
    if is_adjusted:
        args["isAdjusted"] = True
    if adj_reason:
        args["adjustmentReason"] = adj_reason[:200]

    convex_mutation("meals:upsertDailyMeals", args)
    adj_str = f" ⚡ {adj_reason[:50]}" if adj_reason else ""
    print(
        f"  ✓ Chef brief {today}: {len(meals)} meals, {args['totalKcal']}kcal{adj_str}"
    )


def sync_cron(state: dict):
    """Sync cron job statuses from jobs.json (source of truth)."""
    print("⏰ Syncing cron jobs...")

    # Read directly from jobs.json — the platform's source of truth.
    # Falls back to cron_snapshot.json for backwards compatibility.
    jobs_json = os.path.expanduser("~/.openclaw/cron/jobs.json")
    cron_cache = os.path.expanduser("~/.openclaw/workspace/data/cron_snapshot.json")

    source = jobs_json if os.path.exists(jobs_json) else cron_cache
    if not os.path.exists(source):
        print("  ⚠ No cron data — need jobs.json or cron_snapshot.json")
        return
    sig = _file_sig(source)
    if sig and not _changed(state, "cron", sig):
        print("  ↩ Cron data unchanged — skipping")
        return
    with open(source) as f:
        data = json.load(f)

    # jobs.json wraps jobs in {"version":1,"jobs":[...]}, snapshot is a flat list
    jobs = data.get("jobs", data) if isinstance(data, dict) else data

    count = 0
    for job in jobs:
        state = job.get("state", {})
        schedule = job.get("schedule", {})

        # Format schedule for display
        if schedule.get("kind") == "cron":
            sched_str = schedule.get("expr", "?")
            if schedule.get("tz"):
                sched_str += f" ({schedule['tz']})"
        elif schedule.get("kind") == "every":
            ms = schedule.get("everyMs", 0)
            if ms >= 3600000:
                sched_str = f"every {ms // 3600000}h"
            elif ms >= 60000:
                sched_str = f"every {ms // 60000}m"
            else:
                sched_str = f"every {ms // 1000}s"
        else:
            sched_str = str(schedule.get("kind", "?"))

        args = {
            "jobId": job.get("id", ""),
            "name": job.get("name", "unnamed"),
            "schedule": sched_str,
            "enabled": job.get("enabled", True),
            "lastStatus": state.get("lastStatus"),
            "lastRunAt": state.get("lastRunAtMs"),
            "lastDurationMs": state.get("lastDurationMs"),
            "lastError": state.get("lastError") or None,
            "consecutiveErrors": state.get("consecutiveErrors"),
            "nextRunAt": state.get("nextRunAtMs"),
        }
        args = {k: v for k, v in args.items() if v is not None}
        if "jobId" in args:
            convex_mutation("cron:upsertCronJob", args)
            count += 1

    print(f"  ✓ Synced {count} cron jobs")


def sync_weekly_reports(state: dict):
    """Sync weekly reports from quark.db into Convex."""
    import sqlite3

    print("🗂️ Syncing weekly reports...")
    db_path = os.path.join(WORKSPACE, "data", "quark.db")
    if not os.path.exists(db_path):
        print("  ⚠ quark.db not found")
        return

    sig = _file_sig(db_path)
    if sig and not _changed(state, "weekly_reports", sig):
        print("  ↩ Weekly reports unchanged — skipping")
        return

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Check table exists
    exists = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_reports'"
    ).fetchone()
    if not exists:
        db.close()
        print("  ↩ weekly_reports table not yet created")
        return

    rows = db.execute(
        "SELECT domain, week_start, title, summary, content FROM weekly_reports "
        "ORDER BY week_start DESC"
    ).fetchall()
    db.close()

    if not rows:
        print("  ↩ No weekly reports in quark.db")
        return

    max_content = 4000
    count = 0
    for row in rows:
        content = row["content"] or ""
        trimmed = (
            content
            if len(content) <= max_content
            else content[:max_content] + "\n\n[TRUNCATED]"
        )
        args = {
            "domain": row["domain"],
            "reportDate": row["week_start"],
            "title": row["title"] or f"{row['domain']} weekly {row['week_start']}",
            "summary": (row["summary"] or "")[:200] or None,
            "content": trimmed,
        }
        if args["summary"] is None:
            del args["summary"]
        convex_mutation("weekly:upsertWeeklyReport", args)
        count += 1

    print(f"  ✓ Synced {count} weekly reports")


def main():
    parser = argparse.ArgumentParser(description="Sync data to Convex.")
    parser.add_argument(
        "--only",
        help="Comma-separated list: health,tes,weed,trading,meal_log,meal_plan,chef_brief,cron,weekly",
    )
    args = parser.parse_args()

    selected = None
    if args.only:
        selected = set(x.strip() for x in args.only.split(",") if x.strip())

    state = _load_state()
    print(f"🚀 Mission Control Sync — {datetime.now().isoformat()}")
    print(f"   Convex: {CONVEX_URL}")
    if selected:
        print(f"   Only: {', '.join(sorted(selected))}")
    print()

    before = json.dumps(state, sort_keys=True)
    if not selected or "health" in selected:
        sync_health(state)
    if not selected or "tes" in selected:
        sync_tes(state)
    if not selected or "weed" in selected or "ziolo" in selected:
        sync_weed(state)
    if not selected or "trading" in selected:
        sync_trading(state)
    if not selected or "meal_log" in selected:
        sync_meal_log(state)
    if not selected or "meal_plan" in selected:
        sync_meals(state)
    if not selected or "chef_brief" in selected:
        sync_chef_daily_brief(state)
    if not selected or "cron" in selected:
        sync_cron(state)
    if not selected or "trade_log" in selected:
        sync_trade_log(state)
    if not selected or "weekly" in selected:
        sync_weekly_reports(state)

    after = json.dumps(state, sort_keys=True)
    if before != after:
        _save_state(state)

    print()
    print("✅ Sync complete!")


if __name__ == "__main__":
    main()
