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

# 4. 費用の算出（計測の開始時刻と、終了から 10 分ほど後の時刻を UTC で渡す）
#    CloudWatch の AWS/Lambda/Web メトリクス × 東京の Arm 単価。結果は results/lwf-cost-*.md / .json
#    負荷後もしばらく環境が残るので、終了直後ではなく 10 分ほど待ってから集計すると、その分のメモリ代も入る
node scripts/lwf-cost.mjs 2026-10-16T07:09:00Z 2026-10-16T07:28:00Z --profile <profile>

# 5. 削除
cd infra-lwf && npx cdk destroy --force --profile <profile>
```

注意
- PowerShell では `npm run deploy -- --profile x` の `--` が消えるので、上のように `npx cdk` を直接呼んでください。
- サービスが自動で作るロググループ `/aws/lambda/web/<関数名>` は `cdk destroy` では消えません。不要なら手で削除してください。
- 費用の目安は RESULTS.md の第3回を見てください（計測 1 回で約 $1）。
- `lwf-cost.mjs` の単価は 2026-10-16 時点の東京（Arm）の値をスクリプトに書いています。別のリージョンや後日に使うときは、Pricing API（`aws pricing get-products --service-code AWSLambda`）で確かめて書き換えてください。
- cdk-lambda-web は、`fromAsset` の S3 key に prefix が付かない不具合を直したコミット（18ae74b）に固定しています。それより前のコミットだと、デプロイが `The specified S3 object does not exist` で失敗します。
