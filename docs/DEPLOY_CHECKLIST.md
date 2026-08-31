# Deploy Checklist - Creator Growth Tools

Production deploy は OWNER の承認事項である。Claude Code と Codex は deploy を実行しない。
このチェックリストは、承認された場合に何を確認して何を実行するかを固定するためのものである。

## 0. Scope Of This Deploy

対象 branch: `feat/website-pinterest-ready-v0-1`
現在の判定: **merge candidate GO**（ただし `main` merge はまだ実行していない）

含まれる変更:

- `pin001` の実公開状態を registry と article publication log へ反映
- published Pin の platform URL 検証を追加（https + Pinterest host 必須）
- Buffer draft 経路に `approval.scope = buffer_draft` を必須化
- 非 affiliate リンクから `rel="sponsored"` を除去し、CTA に `Affiliate link` / `Official site` ラベルを追加
- 読者向けページから内部運用情報を除去（誤った "pending approval" 表記、affiliate 候補一覧、MVP 表記、privacy policy の内部 TODO）
- privacy policy を実装どおりの記述へ訂正
- homepage / navigation / 404 / sitemap `lastmod` / typography / focus-visible の改善
- `npm run pin:package` による manual publish package 生成

含まれない変更: Pinterest API 連携、Buffer 接続、記事本文の編集、価格・販売条件の変更。

## 1. Pre-Merge Verification

```bash
git fetch origin
git log --oneline origin/main..feat/website-pinterest-ready-v0-1
git diff origin/main...feat/website-pinterest-ready-v0-1 --stat
```

確認項目:

- [ ] 差分が上記 Scope の範囲に収まっている
- [ ] 記事 Markdown (`src/content/articles/*.md`) が変更されていない
- [ ] `data/affiliate-programs.yaml` の approval status が変更されていない
- [ ] Secret、token、credential が差分に含まれていない

## 2. Local Verification

```bash
npm test
npm run build
npx tsc --noEmit
npm run growth:review
npm run buffer:dry-run
npm run pin:package
```

期待値:

- [ ] `npm test` が全件 PASS（fail 0）
- [ ] `npm run build` が 12 pages で Complete
- [ ] `npx tsc --noEmit` が exit 0
- [ ] `growth:review` が `published 1 / 10`、`MEASURE_MORE`、`winner UNKNOWN`
- [ ] `buffer:dry-run` が `BLOCKED_CONFIGURATION_INCOMPLETE` かつ `external_write_attempted: false`
- [ ] `pin:package` が `blockers: []`

## 3. Built Output Verification

```bash
npm run build
```

- [ ] `dist/` 内の内部リンクに 404 が無い
- [ ] 外部リンクは2件のみ
      - `https://kit.com/` -> `rel="nofollow noopener"`（`sponsored` が **付いていない**こと）
      - `https://www.beehiiv.com/?via=5v0uGdI` -> `rel="sponsored nofollow noopener"`
- [ ] `dist/sitemap.xml` に全ページと記事の `lastmod` が入っている
- [ ] `dist/robots.txt` の Sitemap URL が本番ドメインを指している
- [ ] `dist/404.html` が生成されている
- [ ] `MVP` / `pending approval` / `VERIFY_BEFORE_PUBLISH` が HTML に出現しない

## 4. Manual Visual Check (Pinterest Landing Path)

pin001 の実リンクで確認する:
`https://ai-affiliate-bot.pages.dev/kit-vs-beehiiv/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=kit-vs-beehiiv&utm_content=pin002`

- [ ] モバイル幅（375px）で横スクロールが発生しない
- [ ] 見出しが過大にならず、本文が先に読める
- [ ] CTA に `Affiliate link` / `Official site` のラベルが見えている
- [ ] Affiliate disclosure が本文より前に見えている
- [ ] Header の Articles / Methodology / About / Disclosure が全て遷移する

## 5. Merge

`main` merge は OWNER 承認後にのみ実行する。

```bash
git checkout main
git merge --no-ff feat/website-pinterest-ready-v0-1
npm test && npm run build
git push origin main
```

## 6. Deploy

本番 deploy は Cloudflare Pages が `main` を参照する。deploy 実行と確認は OWNER が行う。

- [ ] deploy 前の本番 URL を記録する
- [ ] deploy 後に `/`、`/articles/`、`/kit-vs-beehiiv/`、`/affiliate-disclosure/`、存在しないパスを開く
- [ ] `rel` 属性を本番 HTML で再確認する
- [ ] `sitemap.xml` と `robots.txt` を本番で開く
- [ ] 問題があれば直前の deployment へ rollback する

## 7. Post-Deploy Record

- [ ] deploy 日時、deployment ID、確認結果を `Management/PROJECT_STATUS.md` へ記録する
- [ ] 未確認の項目は `N/A` のまま残す。推測値を入れない

## Prohibited During This Deploy

- Pinterest API publish / credential 登録
- Buffer 接続
- 記事本文の編集
- affiliate approval status の書き換え
- 価格・販売条件の変更
- 新しい SaaS の追加
