#!/usr/bin/env python3
"""Sync Garmin, TES, and Ziolo data to Convex."""

import os
import json
import csv
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
    char_path = f"{WORKSPACE}/data/tes/character.json"
    if not os.path.exists(char_path):
        print("  ⚠ character.json not found")
        return

    with open(char_path) as f:
        char = json.load(f)

    # Count total events from habits.jsonl
    total_events = 0
    habits_path = f"{WORKSPACE}/data/tes/habits.jsonl"
    sig = {"character": _file_sig(char_path), "habits": _file_sig(habits_path)}
    if sig["character"] and not _changed(state, "tes", sig):
        print("  ↩ TES unchanged — skipping")
        return
    if os.path.exists(habits_path):
        with open(habits_path) as hf:
            total_events = sum(1 for line in hf if line.strip())

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
    convex_mutation("tes:upsertTes", args)
    print(f"  ✓ Level {args['level']}, XP {args['xp']}, {len(args['badges'])} badges")


def sync_ziolo(state: dict):
    print("🌿 Syncing Ziolo tracker...")
    csv_path = f"{WORKSPACE}/data/ziolo_tracker.csv"
    if not os.path.exists(csv_path):
        print("  ⚠ ziolo_tracker.csv not found")
        return
    sig = _file_sig(csv_path)
    if sig and not _changed(state, "ziolo", sig):
        print("  ↩ Ziolo unchanged — skipping")
        return

    rows = []
    with open(csv_path) as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        for row in reader:
            if len(row) >= 4:
                rows.append(row)

    if not rows:
        return

    last_row = rows[-1]
    last_use_date = last_row[2].strip() if len(last_row) > 2 else ""
    end_date = last_row[3].strip() if len(last_row) > 3 else ""

    now = datetime.now()
    if not end_date:
        try:
            start = datetime.strptime(last_use_date.split(" ")[0], "%Y-%m-%d")
            current_streak = (now - start).days
        except:
            current_streak = 0
    else:
        current_streak = 0

    current_month = now.strftime("%Y-%m")
    current_year = now.strftime("%Y")
    monthly_use = 0
    yearly_use = 0
    latest_use = ""

    for row in rows:
        start_date_str = row[2].strip() if len(row) > 2 else ""
        if not start_date_str:
            continue
        use_date = start_date_str.split(" ")[0]
        if use_date.startswith(current_month):
            monthly_use += 1
        if use_date.startswith(current_year):
            yearly_use += 1
        latest_use = use_date

    args = {
        "currentStreak": current_streak,
        "lastUseDate": latest_use or now.strftime("%Y-%m-%d"),
        "monthlyUseDays": monthly_use,
        "monthlyGoal": 8,
        "yearlyUseDays": yearly_use,
        "yearlyGoal": 96,
    }
    convex_mutation("ziolo:upsertZiolo", args)
    print(
        f"  ✓ Streak: {current_streak}d, Monthly: {monthly_use}/8, Yearly: {yearly_use}/96"
    )


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
                    if "Position Reconciliation" in line or ("Symbol" in line and "Target Wt" in line):
                        in_pos_table = True
                        continue
                    if in_pos_table:
                        # skip header separator
                        if re.match(r"^\|[\s:|-]+\|", line):
                            continue
                        # stop at next section
                        if line.startswith("#") or (line.strip() and not line.startswith("|")):
                            break
                        pos_m = re.match(
                            r"\|\s*([A-Z]+)\s*\|\s*([-+\d.]+)%\s*\|\s*([-+\d.]+)%\s*\|\s*([-+\d.]+)%\s*\|\s*\$?([-\d,.]+)\s*\|\s*\$?([-\d,.]+)\s*\|",
                            line,
                        )
                        if pos_m:
                            actual_wt = float(pos_m.group(3))
                            pos_breakdown.append({
                                "symbol": pos_m.group(1),
                                "targetWt": float(pos_m.group(2)),
                                "actualWt": actual_wt,
                                "drift": float(pos_m.group(4)),
                                "notional": float(pos_m.group(5).replace(",", "")),
                                "unrealizedPnl": float(pos_m.group(6).replace(",", "")),
                                "side": "short" if actual_wt < 0 else "long" if actual_wt > 0 else "flat",
                            })

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
                print(f"  ✓ Carver Trend v1: ${equity}, Sharpe {sharpe}, {len(pos_breakdown)} positions")
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
                convex_mutation("trading:upsertTrade", {
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
                })
                trades_synced += 1
        except Exception as e:
            print(f"  ⚠ Error parsing {d}: {e}")

    print(f"  ✓ Synced {trades_synced} filled trades")


def sync_meal_log(state: dict):
    """Sync logged meals from SQLite meals.db."""
    import sqlite3

    print("📋 Syncing meal log...")

    db_path = f"{WORKSPACE}/data/meals.db"
    if not os.path.exists(db_path):
        print("  ⚠ meals.db not found")
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
    """Sync weekly meal plan from Obsidian vault (preferred) or Notion fallback."""
    print("🍽️ Syncing meal plan...")
    vault_path = os.environ.get("OBSIDIAN_VAULT_PATH") or os.environ.get(
        "OBSIDIAN_VAULT_REPO_PATH"
    )
    week_label = None
    lines = []

    if vault_path and os.path.isdir(vault_path):
        plans_dir = os.path.join(
            vault_path, "notebook", "areas", "diet", "weekly-plans"
        )
        if not os.path.isdir(plans_dir):
            print("  ⚠ weekly-plans directory not found in vault")
            return
        files = sorted(
            [
                f
                for f in os.listdir(plans_dir)
                if f.startswith("Week of ") and f.endswith(".md")
            ]
        )
        if not files:
            print("  ⚠ No weekly plan files found in vault")
            return
        latest = files[-1]
        week_label = latest.replace(".md", "")
        full_path = os.path.join(plans_dir, latest)
        sig = _file_sig(full_path)
        if sig and not _changed(state, "meal_plan", sig):
            print("  ↩ Meal plan unchanged — skipping")
            return
        with open(full_path) as f:
            lines = [ln.rstrip() for ln in f.readlines()]
    else:
        ai_hub_id = "30d0d52a-f08a-80fe-9d27-c58e931d0495"
        children = fetch_api_bridge(f"/api/notion/blocks/{ai_hub_id}/children")
        if not children:
            print("  ⚠ Can't read AI Hub children")
            return

        results = children.get("results", [])
        meal_pages = []
        for r in results:
            if r.get("type") == "child_page":
                title = r["child_page"].get("title", "")
                if "Week of" in title and "Workout" not in title:
                    meal_pages.append((r["id"], title))

        if not meal_pages:
            print("  ⚠ No meal plan pages found")
            return

        page_id, week_label = meal_pages[-1]
        blocks = fetch_api_bridge(f"/api/notion/blocks/{page_id}/children")
        if not blocks:
            print("  ⚠ Can't read meal plan content")
            return

        for b in blocks.get("results", []):
            t = b.get("type", "")
            if t in ("heading_1", "heading_2", "heading_3"):
                rt = b[t].get("rich_text", [])
                txt = "".join(x.get("plain_text", "") for x in rt)
                lines.append(f"## {txt}")
            elif t == "paragraph":
                rt = b[t].get("rich_text", [])
                txt = "".join(x.get("plain_text", "") for x in rt)
                for subline in txt.split("\n"):
                    lines.append(subline)
            elif t == "bulleted_list_item":
                rt = b[t].get("rich_text", [])
                txt = "".join(x.get("plain_text", "") for x in rt)
                lines.append(f"- {txt}")

    days, summary_lines = _parse_weekly_plan_lines(lines)

    if not days:
        print("  ⚠ No days parsed")
        return

    if not week_label:
        print("  ⚠ Missing week label")
        return

    args = {
        "weekLabel": week_label,
        "days": days,
        "summary": "\n".join(summary_lines) if summary_lines else None,
    }
    if args["summary"] is None:
        del args["summary"]

    convex_mutation("meals:upsertMealPlan", args)
    print(
        f"  ✓ {week_label}: {len(days)} days, {sum(len(d['meals']) for d in days)} meals"
    )


def sync_cron(state: dict):
    """Sync cron job statuses from OpenClaw gateway."""
    print("⏰ Syncing cron jobs...")

    # Read cron jobs from gateway API
    gateway_url = os.environ.get("GATEWAY_URL", "http://localhost:4444")
    gateway_token = os.environ.get("GATEWAY_TOKEN", "")

    cron_cache = os.path.expanduser("~/.openclaw/workspace/data/cron_snapshot.json")
    if not os.path.exists(cron_cache):
        print("  ⚠ No cron snapshot — run: cron list > data/cron_snapshot.json")
        return
    sig = _file_sig(cron_cache)
    if sig and not _changed(state, "cron", sig):
        print("  ↩ Cron snapshot unchanged — skipping")
        return
    with open(cron_cache) as f:
        jobs = json.load(f)

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
    """Sync weekly markdown reports (coach/marco/qq) into Convex."""
    print("🗂️ Syncing weekly reports...")
    max_content_chars = 4000
    base = os.path.join(REPO_DIR, "reports", "weekly")
    domains = {
        "coach": os.path.join(base, "coach"),
        "chef": os.path.join(base, "chef"),
        "marco": os.path.join(base, "marco"),
        "qq": os.path.join(base, "qq"),
    }

    for domain, dirpath in domains.items():
        if not os.path.isdir(dirpath):
            continue
        files = sorted([f for f in os.listdir(dirpath) if f.endswith(".md")])
        if not files:
            continue
        latest = files[-1]
        report_date = latest.replace(".md", "").split("-")[-1]
        full_path = os.path.join(dirpath, latest)
        sig = _file_sig(full_path)
        key = f"weekly_reports_{domain}"
        if sig and not _changed(state, key, sig):
            print(f"  ↩ Weekly report unchanged: {domain}")
            continue
        try:
            with open(full_path) as f:
                content = f.read()
        except Exception as e:
            print(f"  ⚠ {domain} report read failed: {e}")
            continue

        summary = None
        for line in content.splitlines():
            if line.strip().startswith("#"):
                continue
            if line.strip():
                summary = line.strip()
                break

        if summary and len(summary) > 200:
            summary = summary[:200] + "…"
        trimmed = (
            content
            if len(content) <= max_content_chars
            else content[:max_content_chars] + "\n\n[TRUNCATED]"
        )
        args = {
            "domain": domain,
            "reportDate": report_date,
            "title": latest.replace(".md", ""),
            "summary": summary,
            "sourcePath": full_path,
            "content": trimmed,
        }
        convex_mutation("weekly:upsertWeeklyReport", args)
        print(f"  ✓ Weekly report synced: {domain} {report_date}")


def sync_reports(state: dict):
    """Sync structured report JSON files to Convex, then archive them."""
    print("📝 Syncing reports...")
    reports_dir = os.path.join(WORKSPACE, "data", "reports")
    if not os.path.isdir(reports_dir):
        os.makedirs(reports_dir, exist_ok=True)
        print("  ↩ No reports directory")
        return

    archive_dir = os.path.join(reports_dir, "archive")
    os.makedirs(archive_dir, exist_ok=True)

    files = sorted(f for f in os.listdir(reports_dir) if f.endswith(".json"))
    if not files:
        print("  ↩ No pending reports")
        return

    count = 0
    for fname in files:
        fpath = os.path.join(reports_dir, fname)
        try:
            with open(fpath) as f:
                report = json.load(f)
        except Exception as e:
            print(f"  ⚠ Bad JSON in {fname}: {e}")
            continue

        # Validate required fields
        required = ["agent", "reportType", "date", "title", "summary", "content"]
        if not all(k in report for k in required):
            missing = [k for k in required if k not in report]
            print(f"  ⚠ {fname} missing fields: {missing}")
            continue

        # Build reportId if not present
        if "reportId" not in report:
            report["reportId"] = (
                f"{report['agent']}-{report['reportType']}-{report['date']}"
            )

        # Ensure deliveredTo exists
        if "deliveredTo" not in report:
            report["deliveredTo"] = []

        # Truncate content for Convex limits
        content = report["content"]
        overflow = None
        if len(content) > 4000:
            overflow = content[4000:]
            content = content[:4000]

        args = {
            "reportId": report["reportId"],
            "agent": report["agent"],
            "reportType": report["reportType"],
            "date": report["date"],
            "title": report["title"],
            "summary": report["summary"][:500],
            "content": content,
            "deliveredTo": report["deliveredTo"],
        }
        if overflow:
            args["contentOverflow"] = overflow[:4000]
        if report.get("metrics"):
            args["metrics"] = report["metrics"]

        result = convex_mutation("reports:upsertReport", args)
        if result and result.get("status") != "error":
            # Archive processed file
            os.rename(fpath, os.path.join(archive_dir, fname))
            count += 1
        else:
            print(f"  ⚠ Failed to sync {fname}")

    print(f"  ✓ Synced {count} reports ({len(files)} found)")


def main():
    parser = argparse.ArgumentParser(description="Sync data to Convex.")
    parser.add_argument(
        "--only",
        help="Comma-separated list: health,tes,ziolo,trading,meal_log,meal_plan,cron,weekly,reports",
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
    if not selected or "ziolo" in selected:
        sync_ziolo(state)
    if not selected or "trading" in selected:
        sync_trading(state)
    if not selected or "meal_log" in selected:
        sync_meal_log(state)
    if not selected or "meal_plan" in selected:
        sync_meals(state)
    if not selected or "cron" in selected:
        sync_cron(state)
    if not selected or "trade_log" in selected:
        sync_trade_log(state)
    if not selected or "weekly" in selected:
        sync_weekly_reports(state)
    if not selected or "reports" in selected:
        sync_reports(state)

    after = json.dumps(state, sort_keys=True)
    if before != after:
        _save_state(state)

    print()
    print("✅ Sync complete!")


if __name__ == "__main__":
    main()
