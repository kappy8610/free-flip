//自分自身の情報を入れる
const IAM = {
  token: null,  // トークン
  name: null,    // 名前
  is_join: false,  // 入室中？
  flip: null    // フリップ情報
};

// メンバー一覧を入れる箱
const MEMBER = {
  0: "マスター"
};

//-------------------------------------
// Socket.ioサーバへ接続
//-------------------------------------
const socket = io()

// 正常に接続したら
socket.on("connect", ()=>{
  // 表示を切り替える
  if( ! IAM.is_join ){
    document.querySelector("#nowconnecting").style.display = "none";   // 「接続中」を非表示
    document.querySelector("#inputmyname").style.display = "block";    // 名前入力を表示
    document.querySelector("#txt-myname").focus();
  }
});

// トークンを発行されたら
socket.on("token", (data)=>{
  IAM.token = data.token;
});

//-------------------------------------
// STEP2. 名前の入力
//-------------------------------------
/**
 * [イベント] 名前入力フォームが送信された
 */
document.querySelector("#frm-myname").addEventListener("submit", (e)=>{
  // 規定の送信処理をキャンセル(画面遷移しないなど)
  e.preventDefault();

  // 入力内容を取得する
  const myname = document.querySelector("#txt-myname");
  if(myname.value === ""){
    return(false);
  }

  // 名前をセット
  document.querySelector("#myname").innerHTML = `${myname.value}`;
  IAM.name = myname.value;

  // 一覧にフリップを追加する
  socket.emit("join-post", {token:IAM.token, name:IAM.name, flip:IAM.flip})
});

/**
 * [イベント] 入室結果が返ってきた
 */
 socket.on("join-result", (data)=>{
  //------------------------
  // 正常に入室できた
  //------------------------
  if(data.status){
    // 入室フラグを立てる
    IAM.is_join = true;

    indexFlip(data)
    // すでにログイン中のメンバー一覧を反映
    // for(let i=0; i<data.list.length; i++){
    //   const cur = data.list[i];
    //   if(!(cur.token in MEMBER)){
    //     // addMemberList(cur.token, cur.name);
    //     MEMBER[cur.token] = cur.name;
    //   }
    // }

    // 表示を切り替える
    document.querySelector("#inputmyname").style.display = "none";   // 名前入力を非表示
    document.querySelector("#main").style.display = "block";         // フリップ一覧を表示

    // ボタンを無効にする
    document.querySelector("#frm-myname button").setAttribute("disabled", "disabled");

    // 表示を切り替える
    // document.querySelector("#inputmyname").style.display = "none";   // 名前入力を非表示
    // document.querySelector("#chat").style.display = "block";         // チャットを表示
    // document.querySelector("#msg").focus();
  }
  //------------------------
  // できなかった
  //------------------------
  else{
    if(data.msg) {
      alert(data.msg)
    }else{
      alert("入室できませんでした");
    }
  }

  // ボタンを有効に戻す
  document.querySelector("#frm-myname button").removeAttribute("disabled");
});

/**
 * [イベント] フォームが送信された
 */
// document.queryelector("#frm-post").addEventListener("submit", (e)=>{
//   // 規定の送信処理をキャンセル(画面遷移しないなど)
//   e.preventDefault()
  
//   // 入力内容を取得する
//   const msg = document.querySelector("#msg")
//   if( msg.value === "" ){
//     return(false)
//   }
  
//   // Socket.ioサーバへ送信
//   socket.emit("chat-post", {
//     text: msg.value,
//     token: IAM.token,
//     name: IAM.name
//   })
  
//   // 発言フォームを空にする
//   msg.value = ""
// })


/**
 * [イベント] 退室ボタンが押された
 */
document.querySelector("#frm-quit").addEventListener("submit", (e)=>{
  // 規定の送信処理をキャンセル(画面遷移しないなど)
  e.preventDefault();

  if( confirm("本当に退室しますか？") ){
    // Socket.ioサーバへ送信
    socket.emit("quit", {token:IAM.token});

    // ボタンを無効にする
    document.querySelector("#frm-quit button").setAttribute("disabled", "disabled");
  }
});


/**
 * [イベント] 退室処理の結果が返ってきた
 */
 socket.on("quit-result", (data)=>{
  if( data.status ){
    gotoSTEP1();
  }
  else{
    alert("退室できませんでした");
  }

  // ボタンを有効に戻す
  document.querySelector("#frm-quit button").removeAttribute("disabled");
});

/**
 * [イベント] 誰かが入室した
 */
socket.on("member-join", (data)=>{
  if( IAM.is_join ){
    // addMessageFromMaster(`${data.name}さんが入室しました`);
    // addMemberList(data.token, data.name);
    const div = document.querySelector('#flip-index')
    div.insertAdjacentHTML('afterbegin', `
      <div class="item" id="${data.name}-item">
        <p>${data.name}</p>
        <img id="${data.name}" width="200" height="200"/>
      </div>
    `)
  }
});

/**
 * [イベント] 誰かが退室した
 */
socket.on("member-quit", (data)=>{
  if( IAM.is_join ){
    // const name = MEMBER[data.token];
    // addMessageFromMaster(`${name}さんが退室しました`);
    removeMemberList(data.token, data.name);
  }
});

/**
 * [イベント] 誰かが発言した
 */
socket.on("chat", (msg)=>{
  if( IAM.is_join ){
    const is_me = (msg.token === IAM.token);
    addMessage(msg, is_me);
  }
})

/**
 * 最初の状態にもどす
 *
 * @return {void}
 */
 function gotoSTEP1(){
  // NowLoadingから開始
  document.querySelector("#nowconnecting").style.display = "block";  // NowLoadingを表示
  document.querySelector("#inputmyname").style.display = "none";     // 名前入力を非表示
  document.querySelector("#main").style.display = "none";     // 名前入力を非表示
  // document.querySelector("#chat").style.display = "none";            // チャットを非表示
  // フリップリストをすべて削除
  const parent = document.querySelector("#flip-index")
  while(parent.firstChild){
    parent.removeChild(parent.firstChild)
  }

  // 自分の情報を初期化
  IAM.token = null;
  IAM.name = null;
  IAM.is_join = false;

  // メンバー一覧を初期化
  for( let key in MEMBER ){
    if( key !== "0" ){
      delete MEMBER[key];
    }
  }

  // チャット内容を全て消す
  // document.querySelector("#txt-myname").value = "";     // 名前入力欄 STEP2
  // document.querySelector("#myname").innerHTML = "";     // 名前表示欄 STEP3
  // document.querySelector("#msg").value = "";            // 発言入力欄 STEP3
  // document.querySelector("#msglist").innerHTML = "";    // 発言リスト STEP3
  // document.querySelector("#memberlist").innerHTML = ""; // メンバーリスト STEP3

  // Socket.ioサーバへ再接続
  socket.close().open();
}

/**
 * 発言を表示する
 *
 * @param {object}  msg
 * @param {boolean} [is_me=false]
 * @return {void}
 */
 function addMessage(msg, is_me=false){
  const list = document.querySelector("#msglist");
  const li = document.createElement("li");

  // マスターの発言
  if( msg.token === 0 ){
    li.innerHTML = `<span class="msg-master"><span class="name">${name}</span>> ${msg.text}</span>`;
  }
  //------------------------
  // 自分の発言
  //------------------------
  if( is_me ){
    li.innerHTML = `<span class="msg-me"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
  }
  //------------------------
  // 自分以外の発言
  //------------------------
  else{
    li.innerHTML = `<span class="msg-member"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
  }

  // リストの最初に追加
  list.insertBefore(li, list.firstChild);
}

/**
 * チャットマスターの発言
 *
 * @param {string} msg
 * @return {void}
 */
function addMessageFromMaster(msg){
  addMessage({token: 0, text: msg});
}


// フリップ一覧を表示
const indexFlip = data => {
  const div = document.querySelector('#flip-index')
  for(let i = 0; i < data.list.length; i++){
    const cur = data.list[i];
    if(!(cur.token in MEMBER)){
      MEMBER[cur.token] = cur.flip;
      // フリップがなければ白紙、あれば表示
      if(cur.flip === null ){
        div.insertAdjacentHTML('afterbegin', `
          <div class="item" id="${data.name}-item">
            <p>${cur.name}</p>
            <img id="${cur.name}" width="200" height="200"/>
          </div>
        `)
      } else {
        div.insertAdjacentHTML('afterbegin', `
          <div class="item" id="${data.name}-item">
            <p>${cur.name}</p>
            <img src=${cur.flip} id="${cur.name}" width="200" height="200"/>
          </div>
        `)
      }
    }
  }
}

// フリップを追加
// const addFlip = (name, id) => {
//   const div = document.querySelector('#flip-index')
//   div.insertAdjacentHTML('afterbegin', `
//     <div class="item">
//       <p>${name}</p>
//       <img id="${name}_${id}" width="200" height="200"/>
//     </div>
//   `)
// }

// /**
//  * メンバーリストに追加
//  *
//  * @param {string} token
//  * @param {string} name
//  * @return {void}
//  */
// function addMemberList(token, name){
//   const list = document.querySelector("#memberlist");
//   const li = document.createElement("li");
//   li.setAttribute("id", `member-${token}`);
//   if(token == IAM.token){
//     li.innerHTML = `<span class="member-me">${name}</span>`;
//   }
//   else{
//     li.innerHTML = name;
//   }

//   // リストの最後に追加
//   list.appendChild(li);

//   // 内部変数に保存
//   MEMBER[token] = name;
// }

/**
 * メンバーリストから削除
 *
 * @param {string} token
 * @return {void}
 */
function removeMemberList(token, name){
  const id = `#${name}-item`
  console.log(id)
  if(document.querySelector(id) !== null){
    document.querySelector(id).parentNode.removeChild(document.querySelector(id));
  }

  // 内部変数から削除
  delete MEMBER[token];
}

/**
 * [イベント] ページの読込み完了
 */
window.onload = ()=>{
  // テキストボックスを選択する
  // document.querySelector("#msg").focus()
}
