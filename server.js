const crypto = require('crypto');
const app  = require("express")()
const http = require("http").createServer(app)
const io   = require("socket.io")(http)

// HTMLやJSなどを配置するディレクトリ
const DOCUMENT_ROOT = __dirname + "/public"

// トークンを作成する際の秘密鍵
const SECRET_TOKEN = "hogheoghohgoehogheohg";

// チャット参加者一覧
const MEMBER = {};
  // ↑以下のような内容のデータが入る
  // {
  //   "socket.id": {token:"abcd", name:"foo", count:1},
  //   "socket.id": {token:"efgh", name:"bar", count:2}
  // }

// チャット延べ参加者数
let MEMBER_COUNT = 1;

// "/"にアクセスがあったらindex.htmlを返却
app.get("/", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/views/index.html")
})
app.get("/:file", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/" + req.params.file)
})

/**
 * [イベント] ユーザーが接続
 */
io.on("connection", (socket)=>{
  // console.log("ユーザーが接続しました");

  //---------------------------------
  // ログイン
  //---------------------------------
  (()=>{
    // トークンを作成
    const token = makeToken(socket.id);

    // ユーザーリストに追加
    MEMBER[socket.id] = {token: token, name:null, flip:null, count:MEMBER_COUNT};
    MEMBER_COUNT++;

    // 本人にトークンを送付
    io.to(socket.id).emit("token", {token:token})
  })();

  /**
   * [イベント] 入室する
   */
  socket.on("join-post", (data)=>{
    // 同じ名前が既にあったら弾く
    if (getMemberNames().includes(data.name)){
      io.to(socket.id).emit("join-result", {status: false, msg:"同じ名前が既に使われています。"});
    }
    //--------------------------
    // トークンが正しければ
    //--------------------------
    else if(authToken(socket.id, data.token)){
      // メンバー一覧に追加
      MEMBER[socket.id].name = data.name;

      // 入室OK
      const memberlist = getMemberList();
      io.to(socket.id).emit("join-result", {status: true, list: memberlist});

      // 入室通知
      // io.to(socket.id).emit("member-join", data);
      socket.broadcast.emit("member-join", {name:data.name, token:MEMBER[socket.id].count})
    }
    //--------------------------
    // トークンが誤っていた場合
    //--------------------------
    else{
      // 本人にNG通知
      io.to(socket.id).emit("join-result", {status: false});
    }
  })

  /**
   * [イベント] 退室する
   */
  socket.on("quit", (data)=>{
    //--------------------------
    // トークンが正しければ
    //--------------------------
    if( authToken(socket.id, data.token) ){
      // 本人に通知
      io.to(socket.id).emit("quit-result", {status: true});

      // 本人以外に通知
      socket.broadcast.emit("member-quit", {token:MEMBER[socket.id].count, name:MEMBER[socket.id].name});

      // 削除
      delete MEMBER[socket.id];
    }
    //--------------------------
    // トークンが誤っていた場合
    //--------------------------
    else{
      // 本人にNG通知
      io.to(socket.id).emit("quit-result", {status: false});
    }
  })

  // チャット送信
  // socket.on("chat-post", (msg)=>{
  //   io.emit("chat", msg)
  // })

  // 全消し
  socket.on("clear-post", ()=>{
    io.emit("clear")
  })

  // 描画
  // socket.on("draw-post", (x,y)=>{
  //   io.emit("draw", x, y)
  // })

  // 描画開始
  socket.on("dragStart-post", ()=>{
    io.emit("dragStart")
  })

  // 描画終了
  socket.on("dragEnd-post", ()=>{
    io.emit("dragEnd")
  })

  // フリップ送信
  socket.on("flip-post", (flip)=>{
    MEMBER[socket.id] = flip
    io.emit("submit-flip", flip)
  })
})

/**
 * 3000番でサーバを起動する
 */
http.listen(3000, ()=>{
  console.log("listening on *:3000");
})

/**
 * トークンを作成する
 *
//  * @param  {string} id - socket.id
//  * @return {string}
 */
 function makeToken(id){
  const str = SECRET_TOKEN + id;
  return( crypto.createHash("sha1").update(str).digest('hex') );
}

/**
 * 本人からの通信か確認する
 *
 * @param {string} socketid
 * @param {string} token
 * @return {boolean}
 */
function authToken(socketid, token){
  return(
    (socketid in MEMBER) && (token === MEMBER[socketid].token)
  );
}

/**
 * メンバー一覧を作成する
 *
 * @return {array}
 */
function getMemberList(){
  const list = [];
  for( let key in MEMBER ){
    const cur = MEMBER[key];
    if(cur.name !== null){
      list.push({token:cur.count, name:cur.name, flip:cur.flip});
    }
  }
  return(list);
}

// メンバーの名前一覧を取得する
function getMemberNames(){
  const list = [];
  for (let key in MEMBER){
    const cur = MEMBER[key]
    if(cur.name !== null){
      list.push(cur.name)
    }
  }
  return list
}
