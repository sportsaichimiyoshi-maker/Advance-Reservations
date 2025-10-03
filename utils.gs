function formatDateForDisplay(date) {
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(date, tz, 'yyyy-MM-dd');
}

function formatTimeForDisplay(timeValue) {
  return _toTimeString(timeValue);
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  const tz = Session.getScriptTimeZone();
  const dateParts = dateStr.split('-');
  const timeParts = timeStr.split(':');
  
  if (dateParts.length !== 3 || timeParts.length !== 2) return null;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JavaScriptの月は0始まり
  const day = parseInt(dateParts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  
  return new Date(year, month, day, hour, minute);
}

// ユーティリティ: スプレッドシート上の時刻を "HH:mm" 形式に変換
function _toTimeString(val) {
  const tz = Session.getScriptTimeZone();
  if (val == null || val === '') return '';
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val)) {
    return Utilities.formatDate(val, tz, 'HH:mm');
  }
  if (typeof val === 'number') {
    // スプレッドシートの時間シリアル（例: 0.375 = 09:00）を変換
    const ms = Math.round(val * 24 * 60 * 60 * 1000);
    const base = new Date(2000, 0, 1); // 任意の基準日
    return Utilities.formatDate(new Date(base.getTime() + ms), tz, 'HH:mm');
  }
  if (typeof val === 'string') {
    return val; // すでに文字列ならそのまま
  }
  return '';
}

function validateReservationData(data) {
  const errors = [];
  
  // ヘッダー検証
  if (!data.header) errors.push('ヘッダー情報がありません');
  else {
    const requiredHeaderFields = ["所管課(団体)名", "担当者名", "利用団体名", "利用者ID", "利用担当者"];
    requiredHeaderFields.forEach(field => {
      if (!data.header[field]) errors.push(`ヘッダーの${field}が未入力です`);
    });
  }
  
  // 明細検証
  if (!Array.isArray(data.details) || data.details.length === 0) {
    errors.push('明細情報がありません');
  } else {
    data.details.forEach((detail, idx) => {
      const requiredFields = ["区分", "利用日", "利用施設名", "開始時間", "終了時間", "利用者区分"];
      requiredFields.forEach(field => {
        if (!detail[field]) errors.push(`明細${idx+1}の${field}が未入力です`);
      });
      
      // 区分別の必須項目
      if (detail.区分 === "追加" && !detail["利用内容・目的"]) {
        errors.push(`明細${idx+1}の利用内容・目的が未入力です`);
      }
      if (detail.区分 === "削除" && !detail["変更理由"]) {
        errors.push(`明細${idx+1}の変更理由が未入力です`);
      }
    });
  }
  
  return errors;
}
