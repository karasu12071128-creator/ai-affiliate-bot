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
- `beehiiv-review` / `beehiiv-vs-substack` / `best-newsletter-platforms` 記事の新規追加、および Codex adversarial review で見つかった unsupported claims の修正（`kit-review` / `kit-vs-beehiiv` / 各 roundup 記事）
- `data/affiliate-programs.yaml`: ActiveCampaign の承認結果を `pending_review` から `rejected` へ、OWNER Gmail で確認済みの evidence に基づき同期（ActiveCampaign はもともと非 affiliate リンクのまま。beehiiv/Kit の掲載順や評価には影響しない）
- Homepage Trust Layer v1: hero copy を evidence-first な文言へ更新、記事数・情報源・affiliate 開示・最終検証日を示す evidence bar を追加、「How we're different」セクション（unsupported claims を残さない旨の運用姿勢を明文化）を追加、Methodology / Disclosure ページへの導線を強化、カードのアクセント配色などで視覚コントラストを改善（レイアウト構造・配色パレット自体は既存のまま）
- `docs/RESEARCH_SNAPSHOT_2026-08-31.md` を追加

含まれない変更: Pinterest API 連携、Buffer 接続、記事本文の広範な書き換え（unsupported claims の修正と新規記事追加を除く）、価格・販売条件の変更、beehiiv/Kit/ActiveCampaign 以外の affiliate 承認状況の変更。

## 1. Pre-Merge Verification

```bash
git fetch origin
git log --oneline origin/main..feat/website-pinterest-ready-v0-1
git diff origin/main...feat/website-pinterest-ready-v0-1 --stat
```

確認項目:

- [ ] 差分が上記 Scope の範囲に収まっている
- [ ] 記事 Markdown (`src/content/articles/*.md`) の変更が、上記「新規追加」「unsupported claims の修正」の範囲に収まっている（それ以外の広範な書き換えが無い）
- [ ] `data/affiliate-programs.yaml` の approval status の変更が、ActiveCampaign の rejection 同期（evidence 確認済み）以外に無い
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

- [ ] `npm test` が全件 PASS（fail 0。2026-08-31 時点の実測: 32 / 32 PASS）
- [ ] `npm run build` が 15 pages で Complete
- [ ] `npx tsc --noEmit` が exit 0
- [ ] `growth:review` が `published 1 / 10`、`MEASURE_MORE`、`winner UNKNOWN`
- [ ] `buffer:dry-run` が `BLOCKED_CONFIGURATION_INCOMPLETE` かつ `external_write_attempted: false`
- [ ] `pin:package` が `blockers: []`

## 3. Built Output Verification

```bash
npm run build
```

2026-08-31 時点の実測: `npx tsc --noEmit` exit 0、build 出力内の内部リンク broken 0 件（`dist/` 内の全 `href` を静的にスキャンして確認。手動ブラウザ確認は別途未実施）。

- [ ] `dist/` 内の内部リンクに 404 が無い
- [ ] 外部リンクは2件のみ
      - `https://kit.com/` -> `rel="nofollow noopener"`（`sponsored` が **付いていない**こと）
      - `https://www.beehiiv.com/?via=5v0uGdI` -> `rel="sponsored nofollow noopener"`
- [ ] `dist/sitemap.xml` に記事ページの `lastmod` が入っている（`src/pages/sitemap.xml.ts` の実装上、静的ページ（`/`、`/articles/`、`/about/` 等）には `lastmod` を付けていない。これは未確認の更新日を発明しないための意図的な仕様であり、バグではない）
- [ ] `dist/robots.txt` の Sitemap URL が本番ドメインを指している
- [ ] `dist/404.html` が生成されている
- [ ] `MVP` / `pending approval` / `VERIFY_BEFORE_PUBLISH` が HTML に出現しない

## 4. Manual Visual Check (Pinterest Landing Path)

次に手動公開する候補 Pin（`npm run pin:package` の出力、2026-08-31 時点は `pin002`）の実リンクで確認する:
`https://ai-affiliate-bot.pages.dev/kit-vs-beehiiv/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=kit-vs-beehiiv&utm_content=pin002`

- [ ] Homepage（`/`）の evidence bar が 375px 幅で崩れない（横スクロール無し、2カラム表示）
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

deploy 作業（このチェックリストの実行）中に新たに行ってはいけないこと。上記 Scope に記載済みの記事追加・修正や ActiveCampaign rejection 同期は対象外（すでに branch に含まれる確定済みの変更）。

- Pinterest API publish / credential 登録
- Buffer 接続
- 上記 Scope に記載の無い記事本文の追加編集
- 上記 Scope に記載の無い affiliate approval status の書き換え
- 価格・販売条件の変更
- 新しい SaaS の追加
