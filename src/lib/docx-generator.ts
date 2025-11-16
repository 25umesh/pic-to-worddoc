import { Document, Packer, PageBreak, ImageRun, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const readFileAsBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const generateDocx = async (files: File[]) => {
  if (files.length === 0) {
    return;
  }

  const doc = new Document({
    sections: [],
  });

  const imageBuffers = await Promise.all(files.map(file => readFileAsBuffer(file)));
  const imageChunks = [];
  for (let i = 0; i < imageBuffers.length; i += 6) {
    imageChunks.push(imageBuffers.slice(i, i + 6));
  }
  
  const sections = imageChunks.map((chunk, index) => {
    const imageRuns = chunk.map(buffer => {
      return new ImageRun({
        data: buffer,
        transformation: {
          width: 250, // Approx 3.4 inches, fits 2 across on A4 with margins
          height: 250, // Let's use a square, Word will respect aspect ratio if image is not square
        },
      });
    });

    const cells = [...Array(6)].map((_, i) => {
      const content = imageRuns[i] ? [new Paragraph({ children: [imageRuns[i]] })] : [];
      return new TableCell({
        children: content,
        width: {
          size: 4535, // 50% of page width in DXA
          type: WidthType.DXA,
        },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
      });
    });

    const table = new Table({
      columnWidths: [4535, 4535],
      rows: [
        new TableRow({ children: [cells[0], cells[1]] }),
        new TableRow({ children: [cells[2], cells[3]] }),
        new TableRow({ children: [cells[4], cells[5]] }),
      ],
       width: {
        size: 9070, // ~100% of usable page width
        type: WidthType.DXA,
      },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    });

    const children = [table];
    if (index < imageChunks.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    return {
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      children: children,
    };
  });

  doc.addSection(sections[0]);
  if(sections.length > 1) {
    sections.slice(1).forEach(section => {
        doc.addSection(section);
    });
  }


  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'PicPage-Pro.docx');
  } catch (e) {
    console.error("Error packing document:", e);
    throw e;
  }
};
