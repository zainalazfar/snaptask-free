import ExcelJS from 'exceljs';

export const DEFAULT_EXCEL_SETTINGS = {
  preset: 'aesthetic', // 'compact', 'aesthetic', 'spacious', 'custom'
  rowHeightText: 46,
  rowHeightImage: 96,
  taskColWidth: 55,
  zebraStriping: true,
  theme: 'slate' // 'slate' or 'indigo'
};

export const PRESET_OPTIONS = [
  {
    id: 'aesthetic',
    name: 'Aesthetic & Balanced',
    badge: 'Recommended',
    description: 'Generous breathing room, clear typography, and beautifully proportioned screenshots.',
    rowHeightText: 46,
    rowHeightImage: 96,
    taskColWidth: 55
  },
  {
    id: 'spacious',
    name: 'Spacious / Presentation',
    badge: 'Executive',
    description: 'Large screenshots and extra-wide columns designed for slide decks and client meetings.',
    rowHeightText: 60,
    rowHeightImage: 125,
    taskColWidth: 70
  },
  {
    id: 'compact',
    name: 'Compact / High Density',
    badge: 'Dense',
    description: 'Tighter row spacing to review high volumes of tasks on a single screen.',
    rowHeightText: 32,
    rowHeightImage: 68,
    taskColWidth: 42
  }
];

export function getSavedExcelSettings() {
  try {
    const saved = localStorage.getItem('snaptask_excel_settings');
    if (saved) {
      return { ...DEFAULT_EXCEL_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Failed to load excel settings:', err);
  }
  return { ...DEFAULT_EXCEL_SETTINGS };
}

export function saveExcelSettings(settings) {
  try {
    localStorage.setItem('snaptask_excel_settings', JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save excel settings:', err);
  }
}

/**
 * Export tasks to styled Excel (.xlsx) file
 */
export async function exportTasksToExcel(tasks, fileName = 'Meeting_Tasks.xlsx', options = {}) {
  if (!tasks || tasks.length === 0) {
    alert('No tasks to export!');
    return;
  }

  const config = { ...DEFAULT_EXCEL_SETTINGS, ...options };
  const rowHeightText = Number(config.rowHeightText) || 46;
  const rowHeightImage = Number(config.rowHeightImage) || 96;
  const taskColWidth = Number(config.taskColWidth) || 55;
  const zebra = config.zebraStriping !== false;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SnapTask Free';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Meeting Tasks', {
    views: [{ showGridLines: true }]
  });

  // Calculate image thumbnail size proportional to row height
  const imgH = Math.max(45, Math.round(rowHeightImage * 0.72));
  const imgW = Math.round(imgH * 1.45); // 16:10 / 3:2 screenshot aspect ratio

  // Determine max pictures per row to adjust Image column width
  let maxPicsInRow = 1;
  tasks.forEach((task) => {
    const pics = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [task.pictureData] : []);
    if (pics.length > maxPicsInRow) maxPicsInRow = pics.length;
  });

  // Calculate image column width in Excel units (~7.5 pixels per unit)
  const picUnitWidth = Math.max(16, Math.ceil((imgW + 16) / 7.5));
  const imageColWidth = Math.max(26, maxPicsInRow * picUnitWidth + 4);

  // Set columns matching Task Table layout
  worksheet.columns = [
    { header: 'TASK DESCRIPTION', key: 'description', width: taskColWidth },
    { header: 'SCREENSHOT ATTACHMENTS', key: 'image', width: imageColWidth },
    { header: 'PROGRESS', key: 'status', width: 20 },
    { header: 'DATE ADDED', key: 'createdAt', width: 24 }
  ];

  // Header background color
  const headerBgColor = config.theme === 'indigo' ? 'FF4F46E5' : 'FF0F172A';

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerBgColor }
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

  let currentRowIdx = 2;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const dateObj = new Date(task.createdAt);
    const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : task.createdAt;

    const taskPictures = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [{ id: 'legacy-pic', data: task.pictureData, name: task.pictureName }] : []);

    const hasImages = taskPictures.length > 0;

    const row = worksheet.addRow({
      description: task.description || '(No description)',
      image: hasImages ? '' : 'N/A',
      status: task.status || 'Not Started',
      createdAt: dateFormatted
    });

    // Apply custom row height
    row.height = hasImages ? rowHeightImage : rowHeightText;

    // Row zebra background
    const isEven = i % 2 === 1;
    const rowBgColor = zebra && isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    // Style description cell
    const descCell = row.getCell('description');
    descCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    descCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    descCell.border = borderLight;
    descCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

    // Style image cell
    const imageCell = row.getCell('image');
    imageCell.alignment = { vertical: 'middle', horizontal: 'center' };
    imageCell.border = borderLight;
    imageCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
    if (!hasImages) {
      imageCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    }

    // Style status cell (color-coded badge matching UI)
    const statusCell = row.getCell('status');
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    statusCell.border = borderLight;

    const statusText = task.status || 'Not Started';
    let statusBg = 'FFFEE2E2';
    let statusFg = 'FF991B1B';

    if (statusText === 'Done') {
      statusBg = 'FFDCFCE7';
      statusFg = 'FF166534';
    } else if (statusText === 'In Progress') {
      statusBg = 'FFFEF3C7';
      statusFg = 'FF92400E';
    }

    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
    statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: statusFg } };

    // Style date cell
    const dateCell = row.getCell('createdAt');
    dateCell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dateCell.border = borderLight;
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

    // Insert images into Image cell
    if (hasImages) {
      for (let pIdx = 0; pIdx < taskPictures.length; pIdx++) {
        const pic = taskPictures[pIdx];
        if (pic.data && typeof pic.data === 'string' && pic.data.startsWith('data:image')) {
          try {
            const match = pic.data.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
            if (match) {
              const ext = match[1] === 'jpg' ? 'jpeg' : match[1];

              const imageId = workbook.addImage({
                base64: pic.data,
                extension: ext
              });

              // Calculate proportional column placement inside column B (index 1)
              const colOffset = 1.04 + (pIdx * ((imgW + 14) / (imageColWidth * 7.5)));
              const rowVerticalOffset = Math.max(0.06, (rowHeightImage - imgH) / (rowHeightImage * 2));

              worksheet.addImage(imageId, {
                tl: { col: colOffset, row: (currentRowIdx - 1) + rowVerticalOffset },
                ext: { width: imgW, height: imgH },
                editAs: 'oneCell'
              });
            }
          } catch (err) {
            console.error('Error adding image to Excel:', err);
          }
        }
      }
    }

    currentRowIdx++;
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
