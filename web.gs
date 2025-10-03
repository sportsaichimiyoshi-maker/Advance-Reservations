function doGet(e) {
  let htmltemplate=HtmlService.createTemplateFromFile('index')
  htmltemplate.params=JSON.stringify(e.parameter)
  htmltemplate.sessionid=Utilities.getUuid()
  let html=htmltemplate.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('施設予約管理アプリ');
  return(html)
}
/*
function doGet(e) {
  let htmltemplate=HtmlService.createTemplateFromFile('login')
  htmltemplate.params=JSON.stringify(e.parameter)
  htmltemplate.sessionid=Utilities.getUuid()
  let html=htmltemplate.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('施設予約管理アプリ');
  return(html)
}
*/
function include(filename) {
return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// クライアントからのリクエストを処理するメインの関数
  function doPost(e) {
  // クライアントから送られてきたデータ（IDトークンを含む）を取得
  const params = JSON.parse(e.postData.contents);
  const idToken = params.idToken;

  // IDトークンが送られてきていない場合はエラー
  if (!idToken) { return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "IDトークンが必要です。" }))
  .setMimeType(ContentService.MimeType.JSON);
  }

  // ★ここでトークンを検証する★
  const userInfo = verifyIdToken(idToken);

  // 検証に失敗した（userInfoがnullだった）場合は、処理を中断
  if (!userInfo) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "認証に失敗しました。" }))
  .setMimeType(ContentService.MimeType.JSON);
  }

  // — ここから先は、認証が成功したユーザー向けの処理 —

  // userInfo.email や userInfo.localId でユーザーを識別できる
  const userEmail = userInfo.email;

  // 例：スプレッドシートで権限をチェックする
  // const userRole = checkUserRole(userEmail); // 別途、権限チェック関数を作成 // if (userRole !== ‘admin’) { … }

  // 予約処理などを実行
  // …

  // 成功した結果をクライアントに返す
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "処理が完了しました。" }))
  .setMimeType(ContentService.MimeType.JSON);
}
