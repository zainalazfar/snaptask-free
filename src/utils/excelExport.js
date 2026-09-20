import ExcelJS from 'exceljs';

export async function exportTasksToExcel(tasks, fileName = 'Meeting_Tasks.xlsx') {
  if (!tasks || tasks.length === 0) {
    alert('No tasks to export!');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Determine max pictures per row to adjust Image column width
  let maxPicsInRow = 1;
  tasks.forEach((task) => {
    const pics = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [task.pictureData] : []);
    if (pics.length > maxPicsInRow) maxPicsInRow = pics.length;
  });

  const imageColWidth = Math.max(25, maxPicsInRow * 15 + 4);

  // Set columns matching Task Table layout
  worksheet.columns = [
    { header: 'TASK', key: 'description', width: 45 },
    { header: 'IMAGE', key: 'image', width: imageColWidth },
    { header: 'Progress', key: 'status', width: 18 },
    { header: 'Created Date', key: 'createdAt', width: 22 }
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let currentRowIdx = 2;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const dateObj = new Date(task.createdAt);
    const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleString() : task.createdAt;

    const taskPictures = (task.pictures && task.pictures.length > 0)
      ? task.pictures
      : (task.pictureData ? [{ id: 'legacy-pic', data: task.pictureData, name: task.pictureName }] : []);

    const row = worksheet.addRow({
      description: task.description || '(No description)',
      image: taskPictures.length === 0 ? 'N/A' : '',
      status: task.status || 'Not Started',
      createdAt: dateFormatted
    });

    row.getCell('description').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    row.getCell('image').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('createdAt').alignment = { vertical: 'middle', horizontal: 'center' };

    if (taskPictures.length > 0) {
      row.height = 60;

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

              // Column B is index 1. Position each image side-by-side inside column B
              const colOffset = 1.05 + (pIdx * 0.95);
              worksheet.addImage(imageId, {
                tl: { col: colOffset, row: currentRowIdx - 0.90 },
                ext: { width: 75, height: 50 },
                editAs: 'oneCell'
              });
            }
          } catch (err) {
            console.error('Error adding image to Excel:', err);
          }
        }
      }
    } else {
      row.height = 30;
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
