#!/usr/bin/env bash
# Downloads the CodaPet images into public/images so the funnel domain can
# self-host them. Afterwards, point ASSETS in src/lib/funnel.ts at /images/...
set -euo pipefail
cd "$(dirname "$0")/../public/images"
CDN="https://www.codapet.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2F"
curl -fsSL -o codapet-wordmark.svg https://www.codapet.com/images/codapet-new-logo-wordmark.svg
curl -fsSL -o codapet-icon.svg     https://www.codapet.com/images/codapet-icon.svg
curl -fsSL -o welcome.webp  "${CDN}women_and_cat.0gkrq6ggu0ckl.webp&w=828&q=75"
curl -fsSL -o lesson1.webp  "${CDN}homepage_hero.0dlsaz5fn_fym.webp&w=828&q=75"
curl -fsSL -o lesson2.webp  "${CDN}women_holding_dog.1vry454d02jt2.webp&w=828&q=75"
ls -la
