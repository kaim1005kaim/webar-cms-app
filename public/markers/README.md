# ARマーカーディレクトリ

このディレクトリにはAR.js NFTマーカーファイルを配置します。

## NFTマーカーの作成方法

1. 画像を準備（推奨: 480x480px以上のJPEG）
2. [NFT Marker Creator](https://carnaux.github.io/NFT-Marker-Creator/)でマーカー生成
3. 生成された以下のファイルをこのディレクトリに配置:
   - `test-marker.fset`
   - `test-marker.fset3`
   - `test-marker.iset`

## 使用方法

ar.htmlで以下のように参照:
```html
<a-nft
    type="nft"
    url="./markers/test-marker"
    ...>
</a-nft>
```

注意: 拡張子は指定しません。