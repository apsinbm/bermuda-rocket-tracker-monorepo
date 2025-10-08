#!/bin/bash
# Script to move mobile app into monorepo

echo "Moving mobile app to packages/mobile..."
mv /Users/pato/bermuda-rocket-tracker-mobile /Users/pato/bermuda-rocket-tracker-monorepo/packages/mobile

echo "Mobile app moved successfully!"
ls -la /Users/pato/bermuda-rocket-tracker-monorepo/packages/
