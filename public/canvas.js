// ページの読み込みが完了したらコールバック関数が呼ばれる
// ※コールバック: 第2引数の無名関数(=関数名が省略された関数)
window.addEventListener('load', () => {
  const canvas = document.querySelector('#draw-area')
  // contextを使ってcanvasに絵を書いていく
  const context = canvas.getContext('2d')

  // 直前のマウスのcanvas上のx座標とy座標を記録する
  const lastPosition = { x: null, y: null }

  // マウスがドラッグされているか(クリックされたままか)判断するためのフラグ
  let isDrag = false

  // 絵を書く
  const draw = (x, y) => {
    // マウスがドラッグされていなかったら処理を中断する。
    // ドラッグしながらしか絵を書くことが出来ない。
    if(!isDrag) {
      return;
    }

    // 「context.beginPath()」と「context.closePath()」を都度draw関数内で実行するよりも、
    // 線の描き始め(dragStart関数)と線の描き終わり(dragEnd)で1回ずつ読んだほうがより綺麗に線画書ける

    // 線の状態を定義する
    // MDN CanvasRenderingContext2D: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
    context.lineCap = 'round' // 丸みを帯びた線にする
    context.lineJoin = 'round' // 丸みを帯びた線にする
    context.lineWidth = 5 // 線の太さ
    context.strokeStyle = 'black' // 線の色

    // 書き始めは lastPosition.x, lastPosition.y の値はnullとなっているため、
    // クリックしたところを開始点としている。
    // この関数(draw関数内)の最後の2行で lastPosition.xとlastPosition.yに
    // 現在のx, y座標を記録することで、次にマウスを動かした時に、
    // 前回の位置から現在のマウスの位置まで線を引くようになる。
    if (lastPosition.x === null || lastPosition.y === null) {
      // ドラッグ開始時の線の開始位置
      context.moveTo(x, y)
    } else {
      // ドラッグ中の線の開始位置
      context.moveTo(lastPosition.x, lastPosition.y)
    }
    // context.moveToで設定した位置から、context.lineToで設定した位置までの線を引く。
    // - 開始時はmoveToとlineToの値が同じであるためただの点となる。
    // - ドラッグ中はlastPosition変数で前回のマウス位置を記録しているため、
    //   前回の位置から現在の位置までの線(点のつながり)となる
    context.lineTo(x, y)

    // context.moveTo, context.lineToの値を元に実際に線を引く
    context.stroke()

    // 現在のマウス位置を記録して、次回線を書くときの開始点に使う
    lastPosition.x = x
    lastPosition.y = y
  }

  // canvas上に書いた絵を全部消す
  const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  // マウスのドラッグを開始したらisDragのフラグをtrueにしてdraw関数内で
  // お絵かき処理が途中で止まらないようにする
  const dragStart = event => {
    // これから新しい線を書き始めることを宣言する
    // 一連の線を書く処理が終了したらdragEnd関数内のclosePathで終了を宣言する
    context.beginPath()

    isDrag = true
  }
  // マウスのドラッグが終了したら、もしくはマウスがcanvas外に移動したら
  // isDragのフラグをfalseにしてdraw関数内でお絵かき処理が中断されるようにする
  const dragEnd = event => {
    // 線を書く処理の終了を宣言する
    context.closePath()
    isDrag = false

    // 描画中に記録していた値をリセットする
    lastPosition.x = null
    lastPosition.y = null
  }

  const showFlip = flip => {
    id = `#${flip.name}`
    document.querySelector(id).src = flip.flip
  //   const div = document.querySelector('#flip-index')
  //   div.insertAdjacentHTML('afterbegin', `
  //     <div class="item">
  //       <p>${flip.name}</p>
  //       <img src="${flip.flip}" width="200" height="200"/>
  //     </div>
  //   `)
  }

  // const addFlip = (name, id) => {
  //   const div = document.querySelector('#flip-index')
  //   div.insertAdjacentHTML('afterbegin', `
  //     <div class="item">
  //       <p>${name}</p>
  //       <img id="${name}_${id}" width="200" height="200"/>
  //     </div>
  //   `)
  // }

  // マウス操作やボタンクリック時のイベント処理を定義する
  const initEventHandler = () => {
    // フリップの送信
    const submitFlip = document.querySelector('#submit-flip')
    submitFlip.addEventListener('click', ()=>{
      context.getImageData(0, 0, canvas.width, canvas.height)
      const flip = canvas.toDataURL()
      IAM.flip = flip
      socket.emit("flip-post", {
        flip: IAM.flip,
        token: IAM.token,
        name: IAM.name
      })
    })

    // 描画をリアルタイムで共有しない場合
    const clearButton = document.querySelector('#clear-button')
    clearButton.addEventListener('click', clear)
    canvas.addEventListener('mousedown', dragStart)
    canvas.addEventListener('mouseup', dragEnd)
    canvas.addEventListener('mouseout', dragEnd)
    canvas.addEventListener('mousemove', (event) => {
      // eventの中の値を見たい場合は以下のようにconsole.log(event)で、
      // デベロッパーツールのコンソールに出力させると良い
      // console.log(event);

      // if(isDrag) {
        draw(event.layerX, event.layerY)
      // }
    })
    
    // 描画をリアルタイムで更新する場合の処理
    // const clearButton = document.querySelector('#clear-button')
    // clearButton.addEventListener('click', ()=>{socket.emit("clear-post")})
    // canvas.addEventListener('mousedown', ()=>{socket.emit("dragStart-post")})
    // canvas.addEventListener('mouseup', ()=>{socket.emit("dragEnd-post")})
    // canvas.addEventListener('mouseout', ()=>{socket.emit("dragEnd-post")})
    // canvas.addEventListener('mousemove', (event) => {
    //   // eventの中の値を見たい場合は以下のようにconsole.log(event)で、
    //   // デベロッパーツールのコンソールに出力させると良い
    //   // console.log(event);

    //   if(isDrag) {
    //     // Socket.ioサーバへ送信
    //     socket.emit("draw-post", event.layerX, event.layerY)
    //   }
    // })
  }

  /**
   * [イベント] サーバーからの呼び出し
   */
  socket.on("add-flip", (name, id)=>{
    addFlip(name, id)
  })

  // 全消し
  socket.on("clear", ()=>{
    clear()
  })

  // 描画開始
  socket.on("dragStart", ()=>{
    dragStart()
  })

  // 描画
  // socket.on("draw", (x,y)=>{
  //   draw(x, y)
  // })

  // 描画終了
  socket.on("dragEnd", ()=>{
    dragEnd()
  })

  // フリップ受信
  socket.on("submit-flip", (flip)=>{
    showFlip(flip)
  })


  // イベント処理を初期化する
  initEventHandler()
})

