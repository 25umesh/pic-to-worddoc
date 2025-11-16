
import { Document, Packer, PageBreak, ImageRun, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

type ImageDetail = {
  file: File;
  number?: string;
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

  const doc = new Document({
    sections: [],
  });

  const imageBuffers = await Promise.all(imageDetails.map(detail => readFileAsBuffer(detail.file)));
  
  const processedImageDetails = imageDetails.map((detail, index) => ({
    buffer: imageBuffers[index],
    number: detail.number,
  }));

  const imageChunks = [];
  for (let i = 0; i < processedImageDetails.length; i += 6) {
    imageChunks.push(processedImageDetails.slice(i, i + 6));
  }
  
  const sections = imageChunks.map((chunk, index) => {
    const cells = [...Array(6)].map((_, i) => {
      const imageDetail = chunk[i];
      let content: Paragraph[] = [];
      
      if (imageDetail) {
        const imageRun = new ImageRun({
          data: imageDetail.buffer,
          transformation: {
            width: 250,
            height: 250,
          },
        });

        const paragraphChildren = [imageRun];
        
        if (imageDetail.number) {
            paragraphChildren.push(new TextRun({
                text: imageDetail.number,
                bold: true,
                color: "FFFFFF",
                size: 20,
            }));
        }

        const imageParagraph = new Paragraph({ 
          children: paragraphChildren,
          alignment: AlignmentType.CENTER,
          frame: imageDetail.number ? {
            position: {
                x: 100, // in twentieths of a point
                y: 100,
            },
            width: 300, // example width
            height: 300, // example height
            anchor: {
                horizontal: 'page',
                vertical: 'page',
            },
            wrap: 'none',
            zIndex: imageDetail.number ? 2 : 1,
          } : undefined
        });

        if (imageDetail.number) {
          content.push(new Paragraph({
            children: [
              new ImageRun({
                data: imageDetail.buffer,
                transformation: { width: 250, height: 250 },
                floating: {
                  horizontalPosition: { align: 'center' },
                  verticalPosition: { align: 'center' },
                }
              }),
              new TextRun({
                text: imageDetail.number,
                bold: true,
                color: '000000',
                size: 24,
                font: 'Calibri'
              })
            ],
          }));

          const numberParagraph = new Paragraph({
            children: [
              new TextRun({
                text: imageDetail.number,
                bold: true,
                color: "FFFFFF",
                font: "Calibri",
                size: 24, // 12pt
              }),
            ],
            frame: {
              position: {
                x: 200, // in twentieths of a point
                y: 200,
              },
              width: 400,
              height: 400,
              anchor: {
                horizontal: 'page',
                vertical: 'page'
              },
              wrap: 'none',
              zIndex: 3
            },
          });
          const paraWithImage = new Paragraph({ children: [imageRun] });
          content = [paraWithImage];
        } else {
            content = [new Paragraph({ children: [imageRun] })];
        }


      }

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

  doc.addSection(sections[0]);
  if(sections.length > 1) {
    for (let i = 1; i < sections.length; i++) {
        doc.addSection(sections[i]);
    }
  }


  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'PicPage-Pro.docx');
  } catch (e) {
    console.error("Error packing document:", e);
    throw e;
  }
};
