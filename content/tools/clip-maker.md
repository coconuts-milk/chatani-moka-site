---
title: Clip Maker — YouTube 切り抜き
summary: YouTube の 1 場面（最長 60 秒）を切り抜きできる Chrome 拡張。横動画・short 対応、字幕・コメント・隠ぺい窓の ON/OFF 付き。
image: /img/clip-maker/editor.png
badge: NEW
order: 1
download: https://github.com/coconuts-milk/clip-maker-extension/archive/refs/heads/main.zip
---

![](/img/clip-maker/editor.png)

YouTube の 1 場面（最長 60 秒）を、切り抜きできるツールです。
横動画・short 対応、字幕・コメント・隠ぺい窓の ON/OFF 機能付き。

## 拡張機能の導入方法

1. [zip をダウンロード](https://github.com/coconuts-milk/clip-maker-extension/archive/refs/heads/main.zip)して展開する
2. Chrome で `chrome://extensions` を開き、右上の「デベロッパーモード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」で、展開した中の `extension` フォルダを選ぶ

更新するときは、同じ zip をもう一度ダウンロードして展開し、`chrome://extensions` の更新ボタンを押してください。Chrome の起動時に「デベロッパーモードの拡張機能を無効にしますか」と出ることがあります。「キャンセル」で使い続けられます。

## 使い方

:::
![](/img/clip-maker/panel.png)

1. YouTube の動画ページで拡張機能アイコン → Clip Maker 選択
2. 左画像のパネルが横に開くので、切り抜きたい開始時間で停止して「今時間取得」を押すと時間を取得する
3. 「吸い出して編集画面を開く」で録画開始
4. 録画後に編集画面が開く
5. 編集画面の「設定」「字幕」「コメント一覧」で一通りの切り抜き用設定が可能
6. 設定後、「動画を作る（動画タブに移動します）」で切り抜き動画完成版の録画を実行する
:::

## 隠ぺい窓

:::
![隠ぺい窓なし](/img/clip-maker/mask_off.png)

![隠ぺい窓あり](/img/clip-maker/mask_on.png)
:::

出来上がり内のプレビュー画面をドラッグすると、隠ぺい窓を追加できる

## 注意事項

- 切り抜き時間分再生しながら録画を行います。録画中は YouTube のタブを表示したままにしてください。
- 音声認識は初回のみ認識モデル（数百 MB）のダウンロードを行います。このため、音声認識の字幕生成は編集画面表示してから DL 時間 + モデルによる認識時間（数分）後に反映されます。
- 切り抜き動画を作成する際は事前に元動画の権利者の許諾をいただいてください。ご利用はご自身の責任でお願いいたします。
- 基本的には個人配信者・小規模な企業配信者を対象とした切り抜きへの使用を想定しています。ニュースターやアップアンドカミングな配信者向けであり、中堅やベテラン配信者対象の切り抜き・企業様のご利用はお控えいただきますと助かります。
