#!/usr/bin/env python3
"""Migrate weeklyReports -> reports table in Convex. One-time script."""

import os
import json
import urllib.request

CONVEX_URL = os.environ.get(
    "CONVEX_URL", "https://giant-eel-625.eu-west-1.convex.cloud"
)


def convex_mutation(fn_name, args):
    url = f"{CONVEX_URL}/api/mutation"
    payload = json.dumps({"path": fn_name, "args": args, "format": "json"}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def convex_query(fn_name, args):
    url = f"{CONVEX_URL}/api/query"
    payload = json.dumps({"path": fn_name, "args": args, "format": "json"}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


DOMAIN_TO_AGENT = {"coach": "coach", "marco": "marco", "qq": "qq", "chef": "chef"}

result = convex_query("weekly:getWeeklyReports", {})
rows = result.get("value", [])
print(f"Found {len(rows)} weekly reports to migrate")

for r in rows:
    agent = DOMAIN_TO_AGENT.get(r["domain"], r["domain"])
    report_id = f"{agent}-weekly-report-{r['reportDate']}"
    args = {
        "reportId": report_id,
        "agent": agent,
        "reportType": "weekly-report",
        "date": r["reportDate"],
        "title": r.get("title", f"{agent} weekly {r['reportDate']}"),
        "summary": r.get("summary", "")[:500] or "Weekly report",
        "content": r.get("content", "") or "No content available",
        "deliveredTo": ["mission-control"],
    }
    result = convex_mutation("reports:upsertReport", args)
    status = result.get("status", "?")
    print(f"  {report_id}: {status}")

print("Migration complete")
