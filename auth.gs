/**

Firebaseから発行されたIDトークンを検証し、ユーザー情報を返す関数 * @param {string} idToken クライアントから受け取ったIDトークン
@return {object|null} 検証に成功した場合はユーザー情報、失敗した場合はnull
*/

function verifyIdToken(idToken) {
  // Step 1で取得したウェブAPIキーを貼り付けてください
  const config = getConfig();
  const url = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + config.API_KEY;
    try {
    const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
    idToken: idToken
    })
    });

    const content = JSON.parse(response.getContentText());

    // ユーザー情報が取得できれば、その中のusers配列の最初の要素を返す
    if (content.users && content.users.length > 0) {      console.log("認証成功:", content.users[0].email);
      return content.users[0];
    } else {
      console.log("認証失敗: トークンは有効だがユーザー情報が取得できない");
      return null;
    }
  } catch (e) {
    // APIからの応答がエラーだった場合
    console.error("認証エラー:", e.message);
    return null;
  }
}


/**

【要認証】クライアントから呼び出されるサンプル関数
@param {string} idToken クライアントから受け取ったIDトークン
@return {object} クライアントに返す結果オブジェクト
*/
function getProtectedData(idToken) {
  const userInfo = verifyIdToken(idToken);

  if (!userInfo) {
    throw new Error('認証に失敗しました。再度ログインしてください。');
  }

  // ★userInfoからdisplayName（ユーザー名）を取得★
  const userName = userInfo.displayName;
  const userEmail = userInfo.email;

  // ユーザー名が登録されていればユーザー名を、なければメールアドレスを使う
  const displayName = userName || userEmail;

  return {
    status: "success",
    message: `${displayName}さん、こんにちは！これはサーバーから取得した秘密の情報です。`
  };
}
