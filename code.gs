// 予約明細（ListView用）のデータ取得
function getReservations() {
  const config = getConfig();
  const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  const detailSheet = ss.getSheetByName(config.DETAIL_SHEET);
  if (!detailSheet) return [];

  // 予約明細シートの取得（ヘッダー行含む）
  const detailData = detailSheet.getDataRange().getValues();
  if (detailData.length < 2) return []; // ヘッダーのみの場合

  const detailHeaders = detailData.shift(); // １行目がヘッダー
  // 予約一覧（ヘッダー）シートから利用団体名（所属）を取得 → マップを作成
  const headerSheet = ss.getSheetByName(config.HEADER_SHEET);
  const headerData = headerSheet ? headerSheet.getDataRange().getValues() : [];
  let headerHeaders = [];
  let headerMap = {}; // 受付ID をキーに必要なヘッダー情報を格納
  if (headerData.length > 1) {
    headerHeaders = headerData.shift();
    headerData.forEach(function(row) {
      // ヘッダーシートのカラム：受付ID, 所管課(団体)名, 担当者名, 利用団体名, 利用者ID, 利用担当者, 備考, 申請日, 承認日, ステータス
      const idxId = headerHeaders.indexOf('受付ID');
      const idxUtil団体 = headerHeaders.indexOf('利用団体名');
      if (idxId >= 0) {
        headerMap[row[idxId]] = {
        利用団体名: (idxUtil団体 >= 0 ? row[idxUtil団体] : '')
        };
      }
    });
  }

  const tz = Session.getScriptTimeZone();

  // detailHeaders の例: ["明細ID", "受付ID", "区分", "利用日", "利用施設名", "コート等", "開始時間", "終了時間", "利用者区分", "利用内容・目的", "変更理由"]
  const reservations = detailData.map(function(row, index) {
    // オブジェクト作成
    let obj = {};
    detailHeaders.forEach(function(header, i) {
    if ((header === '利用日' || header === '利用日付') && row[i]) {
    // 日付は Date オブジェクトまたは文字列の場合あり
    if (Object.prototype.toString.call(row[i]) === '[object Date]' && !isNaN(row[i])) {
    obj['利用日'] = Utilities.formatDate(new Date(row[i]), tz, 'yyyy-MM-dd');
    } else {
    obj['利用日'] = row[i];
    }
    } else if (header === '開始時間' || header === '終了時間') {
    obj[header] = _toTimeString(row[i]);
    } else {
    obj[header] = row[i];
    }
    });
    // ヘッダー側情報（ここでは所属＝利用団体名）を参照
    const headerInfo = headerMap[obj['受付ID']] || {};
    obj['所属'] = headerInfo.利用団体名 || '';
    // シート上の実際の行番号（ヘッダーを除くので index+2）
    obj.rowNumber = index + 2;
    return obj;
  });

  // 「区分」＝「削除」のレコードは除外する
  return reservations.filter(function(r) {
  return r.区分 !== '削除';
  });
}


function getReservationsWithPaging(page, pageSize) {
  const config = getConfig();
  const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  const detailSheet = ss.getSheetByName(config.DETAIL_SHEET);
  if (!detailSheet) return { items: [], totalCount: 0 };
  
  const detailData = detailSheet.getDataRange().getValues();
  if (detailData.length < 2) return { items: [], totalCount: 0 };
  
  const detailHeaders = detailData.shift();
  // 予約一覧（ヘッダー）シートから利用団体名（所属）を取得 → マップを作成
  const headerSheet = ss.getSheetByName(config.HEADER_SHEET);
  const headerData = headerSheet ? headerSheet.getDataRange().getValues() : [];
  let headerHeaders = [];
  let headerMap = {}; // 受付ID をキーに必要なヘッダー情報を格納
  if (headerData.length > 1) {
    headerHeaders = headerData.shift();
    headerData.forEach(function(row) {
      // ヘッダーシートのカラム：受付ID, 所管課(団体)名, 担当者名, 利用団体名, 利用者ID, 利用担当者, 備考, 申請日, 承認日, ステータス
      const idxId = headerHeaders.indexOf('受付ID');
      const idxUtil団体 = headerHeaders.indexOf('利用団体名');
      if (idxId >= 0) {
        headerMap[row[idxId]] = {
        利用団体名: (idxUtil団体 >= 0 ? row[idxUtil団体] : '')
        };
      }
    });
  }
  // ページングの実装
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, detailData.length);
  const pagedData = detailData.slice(startIndex, endIndex);
  
  // データ変換（既存のコードと同様）
  const reservations = pagedData.map(function(row, index){
    // オブジェクト作成
    let obj = {};
    detailHeaders.forEach(function(header, i) {
    if ((header === '利用日' || header === '利用日付') && row[i]) {
    // 日付は Date オブジェクトまたは文字列の場合あり
    if (Object.prototype.toString.call(row[i]) === '[object Date]' && !isNaN(row[i])) {
    obj['利用日'] = Utilities.formatDate(new Date(row[i]), tz, 'yyyy-MM-dd');
    } else {
    obj['利用日'] = row[i];
    }
    } else if (header === '開始時間' || header === '終了時間') {
    obj[header] = _toTimeString(row[i]);
    } else {
    obj[header] = row[i];
    }
    });
    // ヘッダー側情報（ここでは所属＝利用団体名）を参照
    const headerInfo = headerMap[obj['受付ID']] || {};
    obj['所属'] = headerInfo.利用団体名 || '';
    // シート上の実際の行番号（ヘッダーを除くので index+2）
    obj.rowNumber = index + 2;
    return obj;
  });
  
  // 「区分」＝「削除」のレコードは除外
  const filteredReservations = reservations.filter(r => r.区分 !== '削除');
  
  // 総件数の計算（削除レコードを除く）
  const totalCount = detailData.filter(function(row) {
    const idxKubun = detailHeaders.indexOf('区分');
    return idxKubun >= 0 && row[idxKubun] !== '削除';
  }).length;
  
  return {
    items: filteredReservations,
    totalCount: totalCount,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}


// 新規予約の登録（ヘッダー＋明細の両方に追加）
function addReservation(jsonData) {
  const config = getConfig();
  try {
  // 送信される jsonData は次の形を想定
  // {
  // header: { 所管課(団体)名: "〇〇", 担当者名: "△△", 利用団体名: "□□", 利用者ID: "aaa", 利用担当者: "bbb", 備考:"..." },
  // details: [
  // { 区分: "追加", 利用日: "yyyy-MM-dd", 利用施設名: "...", "コート等": "...", 開始時間:"HH:mm", 終了時間:"HH:mm", 利用者区分:"大人", 利用内容・目的:"...", 変更理由:"" },
  // …（必要な数）
  // ]
  // }

  const data = JSON.parse(jsonData);
  // 入力検証
  const validationErrors = validateReservationData(data);
  if (validationErrors.length > 0) {
    return {
      status: 'error',
      message: '入力内容に問題があります',
      errors: validationErrors
    };
  }
  const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  const headerSheet = ss.getSheetByName(config.HEADER_SHEET);
  const detailSheet = ss.getSheetByName(config.DETAIL_SHEET);
  if (!headerSheet || !detailSheet) throw new Error('必要なシートが見つかりません');

  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const todayStr = Utilities.formatDate(now, tz, "yyyyMMdd");

  // 受付IDの生成：当日分の件数をカウントして次の連番とする方法（シンプルな例）
  const headerData = headerSheet.getDataRange().getValues();
  let sequence = 1;
  if (headerData.length > 1) {
    // 受付IDは先頭8桁が日付
    headerData.slice(1).forEach(function(row) {
      if (row[0] && String(row[0]).substring(0,8) === todayStr) {
        sequence++;
      }
    });
  }
  const seqStr = ("000" + sequence).slice(-3);
  const new受付ID = todayStr + seqStr;


  // ヘッダー情報の新規追加
  const newHeaderRow = [
    new受付ID,
    data.header["所管課(団体)名"] || '',
    data.header["担当者名"] || '',
    data.header["利用団体名"] || '',
    data.header["利用者ID"] || '',
    data.header["利用担当者"] || '',
    data.header["備考"] || '',
    Utilities.formatDate(now, tz, "yyyy-MM-dd"), // 申請日：現在日付
    "", // 承認日は空（後日更新）
    "未処理"
  ];
  
  // 一括書き込み用の明細データ配列
  const newDetailRows = [];
  
  // 明細情報の処理
  if (!Array.isArray(data.details) || data.details.length === 0) {
    throw new Error('明細情報が不足しています');
  }
  
  data.details.forEach(function(detail, index) {
    const detailSeqStr = ("000" + (index + 1)).slice(-3);
    const new明細ID = new受付ID + '-' + detailSeqStr;
    // コート等が配列の場合、文字列に変換
    const courts = Array.isArray(detail["コート等"]) ? detail["コート等"].join(", ") : detail["コート等"] || '';
    
    newDetailRows.push([
      new明細ID,
      new受付ID,
      detail.区分 || '',
      detail.利用日 || '',
      detail.利用施設名 || '',
      courts,
      detail.開始時間 ? detail.開始時間 : '',
      detail.終了時間 ? detail.終了時間 : '',
      detail.利用者区分 || '',
      (detail.区分 === "追加" ? detail["利用内容・目的"] || '' : ''),
      (detail.区分 === "削除" ? detail["変更理由"] || '' : '')
    ]);
  });
  
  // 一括書き込みの実行
  headerSheet.getRange(headerSheet.getLastRow() + 1, 1, 1, newHeaderRow.length).setValues([newHeaderRow]);
  
  if (newDetailRows.length > 0) {
    detailSheet.getRange(detailSheet.getLastRow() + 1, 1, newDetailRows.length, newDetailRows[0].length)
      .setValues(newDetailRows);
  }

  return { status: 'success', 受付ID: new受付ID };
} catch (e) {
    Logger.log('予約追加エラー: ' + e.message);
    return { 
      status: 'error', 
      message: '予約の追加に失敗しました: ' + e.message,
      details: e.stack
    };
  }
}


// 削除（ここでは該当明細レコードの「区分」を「削除」に更新する※ ListView/Caendar では表示しない）
function deleteReservation(rowNumber) {
  const config = getConfig();
  const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  const detailSheet = ss.getSheetByName(config.DETAIL_SHEET);
  if (!detailSheet) throw new Error('予約明細シートが見つかりません');
  // 予約明細シートのヘッダー行を取得して、「区分」が何列目か調べる（例では3列目）
  const headers = detailSheet.getRange(1, 1, 1, detailSheet.getLastColumn()).getValues()[0];
  const idxKubun = headers.indexOf("区分") + 1; // 1-indexed
  if (idxKubun < 1) throw new Error("区分列が見つかりません");
  detailSheet.getRange(rowNumber, idxKubun).setValue("削除");
  return { status: 'deleted' };
}

// 施設一覧シートからオプションを取得（変更なし）
function getFacilityOptions() {
// 施設一覧シート：ヘッダー例
// 施設名 | コート等（カンマ区切り） | 利用時間（カンマ区切り）
const config = getConfig();
const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
const sheet = ss.getSheetByName(config.FACILITY_SHEET);
if (!sheet) return [];
const data = sheet.getDataRange().getValues();
if (data.length < 2) return [];
const headers = data.shift();
const idxName = headers.indexOf('施設名');
const idxCourts = headers.indexOf('コート等');
const idxHours = headers.indexOf('利用時間');
const facilities = data.map(function(row) {
return {
施設名: idxName >= 0 ? row[idxName] : '',
コート等: idxCourts >= 0 && row[idxCourts]
? row[idxCourts].toString().split(',').map(function(s){ return s.trim(); })
: [],
利用時間: idxHours >= 0 && row[idxHours]
? row[idxHours].toString().trim()
: ''
};
});
return facilities;
}
