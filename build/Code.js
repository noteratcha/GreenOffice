// ============================================================
// Green Office Web Application - Server-Side Code
// Google Apps Script
// ============================================================

const SPREADSHEET_ID = '10ZhFi99f45BJ5epvT4bqJ0xMCl-UeMsN3pM3Dbv0Dpo';
const DRIVE_FOLDER_ID = '1jmdhZ0VkyC7M0jCg1JVjrCjOgCKq1xzT';

// ------------------------------------------------------------
// Web App Entry Point
// ------------------------------------------------------------
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Green Office - สำนักงานสีเขียว')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Include helper for CSS/JS partials
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ------------------------------------------------------------
// Authentication
// ------------------------------------------------------------
function checkLogin(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('user&pass');
    if (!sheet) {
      return { success: false, message: 'ไม่พบชีต user&pass' };
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const rowUser = String(data[i][0]).trim();
      const rowPass = String(data[i][1]).trim();

      if (rowUser === username && rowPass === password) {
        const role = data[i][2] ? String(data[i][2]).trim().toLowerCase() : 'user';
        return {
          success: true,
          user: rowUser,
          role: role
        };
      }
    }

    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

// ------------------------------------------------------------
// Image Upload
// ------------------------------------------------------------
function uploadImages(imagesData, username) {
  try {
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

    // Find or create user subfolder
    let userFolder;
    const folders = parentFolder.getFoldersByName(username);
    if (folders.hasNext()) {
      userFolder = folders.next();
    } else {
      userFolder = parentFolder.createFolder(username);
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const results = [];

    for (let i = 0; i < imagesData.length; i++) {
      const imgData = imagesData[i];
      const seq = String(i + 1).padStart(3, '0');
      const fileName = username + '_' + dateStr + '_' + seq + '.jpg';

      const decoded = Utilities.base64Decode(imgData.data);
      const blob = Utilities.newBlob(decoded, imgData.mimeType || 'image/jpeg', fileName);

      const file = userFolder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (errSharing) {
        Logger.log('Sharing warning: ' + errSharing.message);
      }

      results.push({
        id: file.getId(),
        name: fileName,
        url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200'
      });
    }

    return { success: true, count: results.length, files: results };
  } catch (e) {
    Logger.log('uploadImages error: ' + e.message);
    return { success: false, message: 'อัปโหลดไม่สำเร็จ: ' + e.message };
  }
}

// ------------------------------------------------------------
// Delete Image
// ------------------------------------------------------------
function deleteImage(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true };
  } catch (e) {
    return { success: false, message: 'ลบรูปภาพไม่สำเร็จ: ' + e.message };
  }
}

// ------------------------------------------------------------
// Get All Activity Images (Admin Only)
// ------------------------------------------------------------
function getImages() {
  try {
    // 1. Fetch admin users from sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('user&pass');
    const adminUsers = [];
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const role = data[i][2] ? String(data[i][2]).trim().toLowerCase() : 'user';
        if (role === 'admin') {
          adminUsers.push(String(data[i][0]).trim());
        }
      }
    }

    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const images = [];

    // Iterate through user subfolders
    const subFolders = parentFolder.getFolders();
    while (subFolders.hasNext()) {
      const folder = subFolders.next();
      const folderName = folder.getName();

      // Skip non-admin folders (and 'news')
      if (folderName.toLowerCase() !== 'admin' && !adminUsers.includes(folderName)) continue;

      const files = folder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();
        if (mimeType && mimeType.indexOf('image') > -1) {
          images.push({
            id: file.getId(),
            name: file.getName(),
            user: folderName,
            date: file.getDateCreated().toISOString(),
            url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200'
          });
        }
      }
    }

    // Sort newest first
    images.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    return images;
  } catch (e) {
    Logger.log('getImages error: ' + e.message);
    return [];
  }
}

// ------------------------------------------------------------
// News Management
// ------------------------------------------------------------
function getNews() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('news');

    // Create sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet('news');
      sheet.appendRow(['title', 'content', 'date', 'imageFileId', 'user']);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const news = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const userVal = data[i][4] ? String(data[i][4]).trim() : '';
        news.push({
          row: i + 1,
          title: String(data[i][0]),
          content: String(data[i][1]),
          date: String(data[i][2]),
          user: userVal,
          author: userVal,
          imageUrls: data[i][3] 
            ? String(data[i][3]).split(',').map(id => 'https://drive.google.com/thumbnail?id=' + id.trim() + '&sz=w600')
            : [],
          rawImageIds: data[i][3] ? String(data[i][3]) : ''
        });
      }
    }

    // Newest first
    news.reverse();
    return news;
  } catch (e) {
    Logger.log('getNews error: ' + e.message);
    return [];
  }
}

function addNews(title, content, imagesData, username) {
  // Step 1: Save to Spreadsheet first (always works)
  let sheet;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = ss.getSheetByName('news');

    if (!sheet) {
      sheet = ss.insertSheet('news');
      sheet.appendRow(['title', 'content', 'date', 'imageFileId', 'user']);
    }
  } catch (e) {
    Logger.log('addNews Spreadsheet Error: ' + e.message + '\n' + e.stack);
    return { success: false, message: 'เชื่อมต่อ Spreadsheet ไม่ได้: ' + e.message };
  }

  // Step 2: Upload images to Drive
  let imageFileIds = [];
  let imageWarning = '';

  if (imagesData && imagesData.length > 0) {
    try {
      const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      let newsFolder;
      const folders = parentFolder.getFoldersByName('news');
      if (folders.hasNext()) {
        newsFolder = folders.next();
      } else {
        newsFolder = parentFolder.createFolder('news');
      }

      for (let i = 0; i < imagesData.length; i++) {
        const img = imagesData[i];
        if (img && img.data) {
          const decoded = Utilities.base64Decode(img.data);
          const blob = Utilities.newBlob(
            decoded,
            img.mimeType || 'image/jpeg',
            'news_' + Date.now() + '_' + i + '.jpg'
          );

          const file = newsFolder.createFile(blob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (errShare) {
            Logger.log('News image sharing warning: ' + errShare.message);
          }
          imageFileIds.push(file.getId());
        }
      }
    } catch (e) {
      Logger.log('addNews Drive Error: ' + e.message + '\n' + e.stack);
      imageWarning = ' (แต่อัปโหลดรูปไม่สำเร็จ: ' + e.message + ')';
    }
  }

  // Step 3: Write the row
  try {
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    sheet.appendRow([title, content, dateStr, imageFileIds.join(','), username || 'admin']);

    if (imageWarning) {
      return { success: true, message: 'บันทึกข่าวสารสำเร็จ' + imageWarning };
    }
    return { success: true };
  } catch (e) {
    Logger.log('addNews Write Error: ' + e.message + '\n' + e.stack);
    return { success: false, message: 'บันทึกข้อมูลไม่สำเร็จ: ' + e.message };
  }
}

function deleteNews(row) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('news');
    if (!sheet) return { success: false, message: 'ไม่พบชีต news' };

    sheet.deleteRow(row);
    return { success: true };
  } catch (e) {
    return { success: false, message: 'ลบข่าวไม่สำเร็จ: ' + e.message };
  }
}

function editNews(row, title, content, imagesData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('news');
    if (!sheet) return { success: false, message: 'ไม่พบชีต news' };

    // Update title and content
    sheet.getRange(row, 1).setValue(title);
    sheet.getRange(row, 2).setValue(content);
    
    // Update date
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    sheet.getRange(row, 3).setValue(dateStr);

    // If new images provided, upload and replace
    if (imagesData && imagesData.length > 0) {
      const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      let newsFolder;
      const folders = parentFolder.getFoldersByName('news');
      if (folders.hasNext()) {
        newsFolder = folders.next();
      } else {
        newsFolder = parentFolder.createFolder('news');
      }

      let imageFileIds = [];
      for (let i = 0; i < imagesData.length; i++) {
        const img = imagesData[i];
        if (img && img.data) {
          const decoded = Utilities.base64Decode(img.data);
          const blob = Utilities.newBlob(
            decoded,
            img.mimeType || 'image/jpeg',
            'news_edit_' + Date.now() + '_' + i + '.jpg'
          );
          const file = newsFolder.createFile(blob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (errShare) {
            Logger.log('Edit news image sharing warning: ' + errShare.message);
          }
          imageFileIds.push(file.getId());
        }
      }
      sheet.getRange(row, 4).setValue(imageFileIds.join(','));
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: 'แก้ไขข่าวไม่สำเร็จ: ' + e.message };
  }
}

// ------------------------------------------------------------
// Category Links Management
// ------------------------------------------------------------
function getCategoryLinks() {
  try {
    const props = PropertiesService.getScriptProperties();
    const linksJson = props.getProperty('categoryLinks');
    if (linksJson) {
      return JSON.parse(linksJson);
    }
    // Default links
    return [
      "https://drive.google.com/drive/folders/1_jUoKKCrpZcXOqCOI1YmS3YYzggkHAVs?usp=drive_link",
      "https://drive.google.com/drive/folders/168nIWvst4X7ESJSQy5Gn6iKU6mtV0jW2?usp=drive_link",
      "https://drive.google.com/drive/folders/1rCLpI-P5bCoym2Gcs_Mlao8YNdFDLhTg?usp=drive_link",
      "https://drive.google.com/drive/folders/1qjrL4t1Hxj5UAdjTWWpsuczFygbaHQNZ?usp=drive_link",
      "https://drive.google.com/drive/folders/1gIy74CJRHxvQTcE8p30gJ1DLOAVd53GH?usp=drive_link",
      "https://drive.google.com/drive/folders/1Xtw2h0fGS7exmfFxC9GBjJ7nYWhormMg?usp=drive_link",
      "https://drive.google.com/drive/folders/138ATKzL-z0U34rq-2rx5gv-o54j9mTDI?usp=drive_link"
    ];
  } catch (e) {
    Logger.log('getCategoryLinks error: ' + e.message);
    return [];
  }
}

function saveCategoryLinks(links) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('categoryLinks', JSON.stringify(links));
    return { success: true };
  } catch (e) {
    Logger.log('saveCategoryLinks error: ' + e.message);
    return { success: false, message: 'บันทึกข้อมูลไม่สำเร็จ: ' + e.message };
  }
}

// Force OAuth authorization for DriveApp
function authorizeDrive() {
  DriveApp.getFiles();
}

// ------------------------------------------------------------
// Calendar Management
// ------------------------------------------------------------
function ensureCalendarSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('calendar');
  if (!sheet) {
    sheet = ss.insertSheet('calendar');
    sheet.appendRow(['id', 'title', 'start', 'end', 'color', 'allDay']);
    sheet.getRange('A1:F1').setFontWeight('bold').setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getCalendarEvents() {
  try {
    const sheet = ensureCalendarSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const events = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // skip empty ids
      
      let startVal = row[2];
      let endVal = row[3];
      let allDay = row[5] === true || String(row[5]).toLowerCase() === 'true';
      
      if (startVal instanceof Date) {
        if (allDay) {
          startVal = Utilities.formatDate(startVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          startVal = Utilities.formatDate(startVal, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
        }
      }
      if (endVal instanceof Date) {
        if (allDay) {
          endVal = Utilities.formatDate(endVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          endVal = Utilities.formatDate(endVal, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
        }
      }

      events.push({
        id: row[0],
        title: row[1],
        start: startVal,
        end: endVal || null,
        color: row[4] || '#27ae60',
        allDay: allDay
      });
    }
    return events;
  } catch (e) {
    Logger.log('Error getCalendarEvents: ' + e.message);
    return [];
  }
}

function addCalendarEvent(eventData) {
  try {
    const sheet = ensureCalendarSheet();
    const id = Utilities.getUuid();
    
    // date and time parsing
    let start = eventData.date;
    let end = null;
    let allDay = true;
    
    if (eventData.time) {
      start = eventData.date + 'T' + eventData.time + ':00';
      allDay = false;
    }
    
    sheet.appendRow([
      id,
      eventData.title,
      start,
      end, // end time is null for now, can be added later
      eventData.color || '#27ae60',
      allDay
    ]);
    
    return { success: true, message: 'บันทึกกิจกรรมเรียบร้อย' };
  } catch (e) {
    Logger.log('Error addCalendarEvent: ' + e.message);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}


function deleteCalendarEvent(id) {
  try {
    const sheet = ensureCalendarSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'ลบกิจกรรมเรียบร้อยแล้ว' };
      }
    }
    return { success: false, message: 'ไม่พบกิจกรรมที่ต้องการลบ' };
  } catch (e) {
    Logger.log('Error deleteCalendarEvent: ' + e.message);
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}
