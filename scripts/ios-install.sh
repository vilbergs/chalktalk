#!/usr/bin/env bash
# Build a standalone (offline) iOS app and install it on a connected iPhone.
# Picks the first paired physical iPhone; set IOS_DEVICE (name or identifier) to choose one.
set -euo pipefail
cd "$(dirname "$0")/.."

device="${IOS_DEVICE:-}"
if [ -z "$device" ]; then
  list="$(mktemp)"
  xcrun devicectl list devices --json-output "$list" >/dev/null
  device="$(python3 - "$list" <<'EOF'
import json, sys
devices = json.load(open(sys.argv[1]))["result"]["devices"]
for d in devices:
    hw, conn = d["hardwareProperties"], d["connectionProperties"]
    if hw.get("platform") == "iOS" and hw.get("reality") == "physical" and conn.get("pairingState") == "paired":
        print(d["identifier"])
        break
EOF
)"
  rm -f "$list"
fi
if [ -z "$device" ]; then
  echo "No paired iPhone found. Connect and unlock it, or set IOS_DEVICE." >&2
  exit 1
fi

bunx tauri ios build --export-method debugging
xcrun devicectl device install app --device "$device" src-tauri/gen/apple/build/arm64/chalktalk.ipa
xcrun devicectl device process launch --device "$device" com.vilberg.chalktalk \
  || echo "Installed. If it won't open, trust the developer in Settings > General > VPN & Device Management."
