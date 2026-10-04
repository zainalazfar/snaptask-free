import ExcelJS from 'exceljs';

/**
 * Prepares individual screenshots for a task:
 * - Each image is processed individually with smooth rounded corners and high-resolution rendering.
 * - Kept as distinct, separate image objects so that in Excel & Google Sheets,
 *   each screenshot can be clicked, inspected, and manipulated independently (NOT grouped).
 * - Placed side-by-side with balanced gap.
 */
async function prepareIndividualTaskImages(dataUrls, maxTotalW = 360, targetH = 88) {
  if (!dataUrls || dataUrls.length === 0) return [];

  return new Promise((resolve) => {
    let loaded = 0;
    const imgElements = [];

    dataUrls.forEach((url, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        imgElements[idx] = img;
        loaded++;
        if (loaded === dataUrls.length) process();
      };

      img.onerror = () => {
        imgElements[idx] = null;
        loaded++;
        if (loaded === dataUrls.length) process();
      };

      img.src = url;
    });

    function process() {
      const validImages = imgElements.filter(Boolean);
      if (validImages.length === 0) {
        resolve([]);
        return;
      }

      const count = validImages.length;
      const gap = 10;

      // Base target display height:
      // Single image: 88px
      // 2 images: 84px
      // 3 images: 78px
      // 4-5 images: 70px
      let baseH = targetH;
      if (count === 2) baseH = 84;
      else if (count === 3) baseH = 78;
      else if (count >= 4) baseH = 70;

      // Calculate display dimensions for each image preserving natural aspect ratio
      const items = validImages.map((img) => {
        const natW = img.naturalWidth || img.width || 300;
        const natH = img.naturalHeight || img.height || 200;
        const aspect = natW / natH;
        const w = Math.round(baseH * aspect);
        return { img, natW, natH, aspect, w, h: baseH };
      });

      let totalW = items.reduce((sum, item) => sum + item.w, 0) + ((count - 1) * gap);

      // If total width of all images exceeds max allowed space, scale down proportionally
      if (totalW > maxTotalW) {
        const scale = maxTotalW / totalW;
        items.forEach((item) => {
          item.w = Math.round(item.w * scale);
          item.h = Math.round(item.h * scale);
        });
      }

      // Render each image INDIVIDUALLY onto its own high-resolution canvas with rounded corners
      const processedImages = items.map((item) => {
        const highResH = Math.min(1600, Math.max(item.h * 4, item.natH));
        const scaleFactor = Math.max(2, highResH / item.h);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(item.w * scaleFactor);
        canvas.height = Math.round(item.h * scaleFactor);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleFactor, scaleFactor);

        const radius = Math.max(6, Math.min(14, Math.round(Math.min(item.w, item.h) * 0.08)));

        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(0, 0, item.w, item.h, radius);
        } else {
          ctx.moveTo(radius, 0);
          ctx.lineTo(item.w - radius, 0);
          ctx.quadraticCurveTo(item.w, 0, item.w, radius);
          ctx.lineTo(item.w, item.h - radius);
          ctx.quadraticCurveTo(item.w, item.h, item.w - radius, item.h);
          ctx.lineTo(radius, item.h);
          ctx.quadraticCurveTo(0, item.h, 0, item.h - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
        }
        ctx.clip();

        ctx.drawImage(item.img, 0, 0, item.w, item.h);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        const pngDataUrl = canvas.toDataURL('image/png');
        const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

        return {
          base64: base64Data,
          extension: 'png',
          displayW: item.w,
          displayH: item.h
        };
      });

      resolve(processedImages);
    }
  });
}

/**
 * Export tasks to styled Excel (.xlsx) file
 */
export async function exportTasksToExcel(tasks, fileName = 'Meeting_Tasks.xlsx') {
  if (!tasks || tasks.length === 0) {
    alert('No tasks to export!');
    return;
  }

  // Row heights in points (96pt = 128px)
  const rowHeightText = 46;
  const rowHeightImage = 96;
  const taskColWidth = 55;
  const zebraStriping = true;
  const rowPixels = Math.round(rowHeightImage * 1.3333); // 128px
  const gap = 10;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SnapTask Free';
  workbook.created = new Date();

  // Single clean sheet
  const worksheet = workbook.addWorksheet('Meeting Tasks', {
    views: [{ showGridLines: true }]
  });

  // Pre-process individual images for each task (limit to max 5 images per task)
  const taskImagesList = [];
  let maxNeededWidth = 140;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskPictures = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [{ id: 'legacy-pic', data: task.pictureData, name: task.pictureName }] : []);

    const rawUrls = taskPictures
      .slice(0, 5) // Enforce maximum 5 images per task
      .map((p) => p?.data || p)
      .filter((url) => typeof url === 'string' && url.startsWith('data:image'));

    if (rawUrls.length > 0) {
      const individualImages = await prepareIndividualTaskImages(rawUrls, 360, 88);
      taskImagesList.push(individualImages);

      if (individualImages.length > 0) {
        const taskTotalW = individualImages.reduce((sum, img) => sum + img.displayW, 0) + ((individualImages.length - 1) * gap);
        if (taskTotalW > maxNeededWidth) {
          maxNeededWidth = taskTotalW;
        }
      }
    } else {
      taskImagesList.push([]);
    }
  }

  // Pre-process evidence images for each task (1 image per evidence)
  const evidenceImagesList = [];
  let maxEvidenceWidth = 100;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const evPics = (task.evidencePictures && task.evidencePictures.length > 0)
      ? task.evidencePictures
      : [];

    const rawEvUrls = evPics
      .slice(0, 1) // Enforce 1 image per evidence
      .map((p) => p?.data || p)
      .filter((url) => typeof url === 'string' && url.startsWith('data:image'));

    if (rawEvUrls.length > 0) {
      const preparedEv = await prepareIndividualTaskImages(rawEvUrls, 360, 88);
      evidenceImagesList.push(preparedEv);

      if (preparedEv.length > 0 && preparedEv[0].displayW > maxEvidenceWidth) {
        maxEvidenceWidth = preparedEv[0].displayW;
      }
    } else {
      evidenceImagesList.push([]);
    }
  }

  // Column B width tailored to the widest set of images + padding
  const imageColWidth = Math.max(30, Math.min(68, Math.ceil((maxNeededWidth + 30) / 7.5)));
  const colBPixels = imageColWidth * 7.5;

  // Column E width tailored to evidence image + padding
  const evidenceColWidth = Math.max(26, Math.min(50, Math.ceil((maxEvidenceWidth + 24) / 7.5)));
  const colEPixels = evidenceColWidth * 7.5;

  // Setup worksheet columns with dedicated REMARK and EVIDENCE columns
  worksheet.columns = [
    { header: 'TASK DESCRIPTION', key: 'description', width: taskColWidth },
    { header: 'SCREENSHOT ATTACHMENTS', key: 'image', width: imageColWidth },
    { header: 'PROGRESS', key: 'status', width: 18 },
    { header: 'REMARK', key: 'remark', width: 32 },
    { header: 'EVIDENCE', key: 'evidence', width: evidenceColWidth },
    { header: 'DATE ADDED', key: 'createdAt', width: 22 }
  ];

  // Style Header Row (Deep modern slate)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  const borderLight = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const imageList = taskImagesList[i] || [];
    const hasImages = imageList.length > 0;
    const evImageList = evidenceImagesList[i] || [];
    const hasEvidence = evImageList.length > 0;

    const dateObj = new Date(task.createdAt);
    const dateFormatted = !isNaN(dateObj) 
      ? dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
      : task.createdAt;

    const exportDesc = task.description || '(No description)';

    const row = worksheet.addRow({
      description: exportDesc,
      image: hasImages ? '' : 'N/A',
      status: task.status === 'Done' ? 'Done' : 'Open',
      remark: task.remark || '-',
      evidence: hasEvidence ? '' : 'N/A',
      createdAt: dateFormatted
    });

    // Row Height (accommodates either task screenshot or evidence screenshot)
    row.height = (hasImages || hasEvidence) ? rowHeightImage : (task.remark && task.remark.length > 60 ? 56 : rowHeightText);

    // Row zebra background
    const isEven = i % 2 === 1;
    const rowBgColor = zebraStriping && isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    // 1. Task Description Cell
    const descCell = row.getCell('description');
    descCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    descCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    descCell.border = borderLight;
    descCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

    // 2. Screenshot Attachments Cell
    const imageCell = row.getCell('image');
    imageCell.alignment = { vertical: 'middle', horizontal: 'center' };
    imageCell.border = borderLight;
    imageCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
    if (!hasImages) {
      imageCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    }

    // 3. Progress Status Cell with Native Data Validation Dropdown
    const statusCell = row.getCell('status');
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    statusCell.border = borderLight;

    statusCell.dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Open,Done"']
    };

    const statusText = task.status === 'Done' ? 'Done' : 'Open';
    let statusBg = 'FFFEE2E2';
    let statusFg = 'FF991B1B';

    if (statusText === 'Done') {
      statusBg = 'FFDCFCE7';
      statusFg = 'FF166534';
    }

    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
    statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: statusFg } };

    // 4. Remark Cell
    const remarkCell = row.getCell('remark');
    remarkCell.font = { name: 'Segoe UI', size: 9.5, italic: !task.remark, color: { argb: task.remark ? 'FF1E293B' : 'FF94A3B8' } };
    remarkCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    remarkCell.border = borderLight;
    remarkCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

    // 5. Evidence Cell
    const evidenceCell = row.getCell('evidence');
    evidenceCell.alignment = { vertical: 'middle', horizontal: 'center' };
    evidenceCell.border = borderLight;
    evidenceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
    if (!hasEvidence) {
      evidenceCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    }

    // 6. Date Cell
    const dateCell = row.getCell('createdAt');
    dateCell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dateCell.border = borderLight;
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

    // 7. Position Task Screenshot Images (Column B)
    if (hasImages) {
      try {
        const totalTaskW = imageList.reduce((sum, img) => sum + img.displayW, 0) + ((imageList.length - 1) * gap);
        let currentXOffset = Math.max(10, Math.round((colBPixels - totalTaskW) / 2));

        for (const img of imageList) {
          const imageId = workbook.addImage({
            base64: img.base64,
            extension: 'png'
          });

          // Exact vertical centering inside this row
          const yOffsetPx = Math.max(6, Math.round((rowPixels - img.displayH) / 2));

          worksheet.addImage(imageId, {
            tl: {
              nativeCol: 1, // Column B
              nativeColOff: Math.round(currentXOffset * 9525),
              nativeRow: row.number - 1,
              nativeRowOff: Math.round(yOffsetPx * 9525)
            },
            ext: { width: img.displayW, height: img.displayH },
            editAs: 'oneCell'
          });

          currentXOffset += img.displayW + gap;
        }
      } catch (err) {
        console.error('Error adding task images to cell:', err);
      }
    }

    // 8. Position Evidence Image (Column E)
    if (hasEvidence) {
      try {
        const evImg = evImageList[0];
        const imageId = workbook.addImage({
          base64: evImg.base64,
          extension: 'png'
        });

        const xOffsetPx = Math.max(8, Math.round((colEPixels - evImg.displayW) / 2));
        const yOffsetPx = Math.max(6, Math.round((rowPixels - evImg.displayH) / 2));

        worksheet.addImage(imageId, {
          tl: {
            nativeCol: 4, // Column E (EVIDENCE)
            nativeColOff: Math.round(xOffsetPx * 9525),
            nativeRow: row.number - 1,
            nativeRowOff: Math.round(yOffsetPx * 9525)
          },
          ext: { width: evImg.displayW, height: evImg.displayH },
          editAs: 'oneCell'
        });
      } catch (err) {
        console.error('Error adding evidence image to Excel:', err);
      }
    }
  }

  // Conditional Formatting for Progress Dropdown
  if (tasks.length > 0) {
    try {
      worksheet.addConditionalFormatting({
        ref: `C2:C${tasks.length + 1}`,
        rules: [
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"Done"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCFCE7' } },
              font: { color: { argb: 'FF166534' }, bold: true }
            }
          },
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"In Progress"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF3C7' } },
              font: { color: { argb: 'FF92400E' }, bold: true }
            }
          },
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"Not Started"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
              font: { color: { argb: 'FF991B1B' }, bold: true }
            }
          }
        ]
      });
    } catch (cfErr) {
      console.warn('Conditional formatting note:', cfErr);
    }
  }

  // Generate binary Excel buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
