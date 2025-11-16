
import { Document, Packer, PageBreak, ImageRun, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun, AlignmentType, VerticalAlign, HeightRule } from 'docx';
import { saveAs } from 'file-saver';

type ImageDetail = {
  file: File;
  number?: string;
  filename?: string;
};

const readFileAsBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const generateDocx = async (imageDetails: ImageDetail[]) => {
  if (imageDetails.length === 0) {
    return;
  }

  const imageBuffers = await Promise.all(imageDetails.map(detail => readFileAsBuffer(detail.file)));
  
  const processedImageDetails = imageDetails.map((detail, index) => ({
    buffer: imageBuffers[index],
    number: detail.number,
    filename: detail.filename,
  }));

  const imageChunks = [];
  for (let i = 0; i < processedImageDetails.length; i += 6) {
    imageChunks.push(processedImageDetails.slice(i, i + 6));
  }
  
  const sections = imageChunks.map((chunk, index) => {
    const tableRows = [0, 2, 4].map(startIndex => {
      const cells = [startIndex, startIndex + 1].map(i => {
        const imageDetail = chunk[i];
        if (imageDetail) {
          
          const cellChildren = [];

          if (imageDetail.number) {
            cellChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: imageDetail.number,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Calibri',
                  })
                ],
                alignment: AlignmentType.CENTER,
              })
            );
          }

          const imageRun = new ImageRun({
            data: imageDetail.buffer,
            transformation: {
              width: 250,
              height: 250,
            },
          });
          
          cellChildren.push(new Paragraph({
            children: [imageRun],
            alignment: AlignmentType.CENTER,
          }));

          if (imageDetail.filename) {
            cellChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: imageDetail.filename,
                    size: 16, // 8pt
                    font: 'Calibri',
                  })
                ],
                alignment: AlignmentType.CENTER,
              })
            );
          }


          return new TableCell({
            children: cellChildren,
            verticalAlign: VerticalAlign.TOP,
            width: {
              size: 4535,
              type: WidthType.DXA,
            },
             borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          });
        }

        // Empty cell
        return new TableCell({
          children: [new Paragraph('')],
           borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
        });
      });
      return new TableRow({ children: cells, height: { value: 3750, rule: HeightRule.AT_LEAST } });
    });


    const table = new Table({
      columnWidths: [4535, 4535],
      rows: tableRows,
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

    const children: (Table | Paragraph)[] = [table];
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
  
  const doc = new Document({
    sections: sections,
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'PicPage-Pro.docx');
  } catch (e) {
    console.error("Error packing document:", e);
    throw e;
  }
};
