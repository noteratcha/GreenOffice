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
    .setTitle('Green Office - กิจกรรมสีเขียว')
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
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      results.push({
        id: file.getId(),
        name: fileName,
        url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200'
      });
    }

    return { success: true, count: results.length, files: results };
  } catch (e) {
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
      // Allow if the user has admin role OR if the folder name is explicitly 'admin'
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
      sheet.appendRow(['title', 'content', 'date', 'imageFileId']);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const news = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        news.push({
          title: String(data[i][0]),
          content: String(data[i][1]),
          date: String(data[i][2]),
          imageUrls: data[i][3] 
            ? String(data[i][3]).split(',').map(id => 'https://drive.google.com/thumbnail?id=' + id.trim() + '&sz=w600')
            : []
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

function addNews(title, content, imagesData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('news');

    if (!sheet) {
      sheet = ss.insertSheet('news');
      sheet.appendRow(['title', 'content', 'date', 'imageFileId']);
    }

    let imageFileIds = [];

    if (imagesData && imagesData.length > 0) {
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
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          imageFileIds.push(file.getId());
        }
      }
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

    sheet.appendRow([title, content, dateStr, imageFileIds.join(',')]);

    return { success: true };
  } catch (e) {
    return { success: false, message: 'เพิ่มข่าวไม่สำเร็จ: ' + e.message };
  }
}

function deleteNews(rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('news');
    if (!sheet) return { success: false, message: 'ไม่พบชีต news' };

    // rowIndex is 0-based from client (excluding header)
    // Sheet rows are 1-based, row 1 is header
    sheet.deleteRow(rowIndex + 2);
    return { success: true };
  } catch (e) {
    return { success: false, message: 'ลบข่าวไม่สำเร็จ: ' + e.message };
  }
}
