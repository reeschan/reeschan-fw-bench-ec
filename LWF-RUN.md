# Lambda Web Functions で計測する手順

前提: Node.js 22 以上、AWS CLI、デプロイ先アカウントのプロファイル（以下 `<profile>`）。リージョンは ap-northeast-1 を既定にしています（`CDK_DEFAULT_REGION` で変更可）。

```bash
# 1. 各アプリをビルドして Lambda 用バンドル（dist-lwf/）を作る
./scripts/build-all.sh        # docker compose build の手前までで止めて構いません
./scripts/package-lwf.sh

# 2. デプロイ（data-api + 5 アプリ）
cd infra-lwf && npm ci
npx cdk bootstrap --profile <profile>     # 未ブートストラップのときだけ
npx cdk deploy --profile <profile> --require-approval never --outputs-file outputs.json

# 3. 計測（infra-lwf/outputs.json の URL を使う）
cd ../scripts && npm ci && cd ..
node scripts/bench-remote.mjs             # --quick で短縮版。結果は results/lwf-*.md / .json

# 4. 削除
cd infra-lwf && npx cdk destroy --force --profile <profile>
```

注意
- PowerShell では `npm run deploy -- --profile x` の `--` が消えるので、上のように `npx cdk` を直接呼んでください。
- サービスが自動で作るロググループ `/aws/lambda/web/<関数名>` は `cdk destroy` では消えません。不要なら手で削除してください。
- 費用の目安は RESULTS.md の第3回を見てください（計測 1 回で約 $1）。
