// 初期設定用の関数（手動実行）
function setSpreadsheetConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'SPREADSHEET_ID': '1qKmH8wCZYhoOEhS9LzRJZQ0ERxvSzf7Z0EG1ldyNXtU',
    'HEADER_SHEET': '予約一覧',
    'DETAIL_SHEET': '予約明細',
    'FACILITY_SHEET': '施設一覧'
  });
  Logger.log('設定が保存されました');
}

// 設定を取得し、未設定なら初期化する関数
function getConfig() {
  const properties = PropertiesService.getScriptProperties().getProperties();
  
  // 必須設定が存在しない場合は初期化
  if (!properties.SPREADSHEET_ID) {
    setSpreadsheetConfig();
    return PropertiesService.getScriptProperties().getProperties();
  }
  
  return properties;
}
