# FreeFlip

- 簡単な絵などを描いて共有できるシステム
- お絵描きの大喜利、oxなどのクイズ、フリップを使ってオンラインボードゲームなどに使える

## デプロイ先
- http://ec2-3-138-197-125.us-east-2.compute.amazonaws.com:3000/

## 環境構築

```bash
$ sudo apt install npm
$ npm init
$ sudo npm install socket.io express
$ node server.js
```

### トラブルシューティング
- ubuntu18.04を使っている場合はのnodeのバージョンを変える必要がある
- 参考:https://github.com/nodesource/distributions
```bash
$ curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
& sudo apt-get install -y nodejs
```

## バージョン
- npm 6.14.12
- node v12.22.1