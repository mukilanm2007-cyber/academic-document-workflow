const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate official institutional PDF document
 */
async function generateOfficialPDF(requestData, studentData, docTypeData, approverUser) {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const docCode = (docTypeData.code || 'DOC').toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const documentNumber = `APEX-${docCode}-${new Date().getFullYear()}-${randomSuffix}`;
      const fileName = `issued_${docCode}_${requestData.reference_number}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `uploads/${fileName}`;

      const verificationCode = crypto
        .createHash('sha256')
        .update(`${documentNumber}_${requestData.reference_number}_${studentData.registration_number}_${Date.now()}`)
        .digest('hex');

      const doc = new PDFDocument({
        size: 'A4',
        margin: 45
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Outer Decorative Border
      doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#1E3A8A').stroke();
      doc.rect(25, 25, 545, 792).lineWidth(0.75).strokeColor('#0D9488').stroke();

      // Header Banner
      doc.rect(27, 27, 541, 100).fillColor('#0F172A').fill();

      // University Name & Emblem Placeholder
      doc.fillColor('#FFFFFF')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('APEX INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY', 35, 45, { align: 'center', width: 525 });

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#94A3B8')
        .text('Affiliated with State Technological University | Accredited Grade "A+"', 35, 70, { align: 'center', width: 525 });

      doc.fontSize(9)
        .fillColor('#38BDF8')
        .text('OFFICE OF ACADEMIC AFFAIRS & STUDENT RECORDS | ISO 9001:2015 CERTIFIED', 35, 88, { align: 'center', width: 525 });

      // Document Title Header
      doc.moveDown(3);
      doc.fillColor('#1E3A8A')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(docTypeData.name.toUpperCase(), { align: 'center', underline: true });

      doc.moveDown(0.5);
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#64748B')
        .text(`Document Reference: ${documentNumber}   |   Application Ref: ${requestData.reference_number}`, { align: 'center' });

      // Issue Meta Details Bar
      doc.moveDown(1);
      const metaY = doc.y;
      doc.rect(40, metaY, 515, 26).fillColor('#F1F5F9').fill();
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
      doc.text(`Issue Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, metaY + 8);
      doc.text(`Department: ${studentData.department_name || 'Academic Affairs'}`, 240, metaY + 8);
      doc.text(`Status: VERIFIED & ISSUED`, 420, metaY + 8);

      // Student Profile Information Box
      doc.moveDown(2);
      const studentBoxY = doc.y + 10;
      doc.rect(40, studentBoxY, 515, 85).lineWidth(1).strokeColor('#CBD5E1').stroke();
      doc.rect(40, studentBoxY, 515, 20).fillColor('#E2E8F0').fill();
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('STUDENT CREDENTIAL DETAILS', 50, studentBoxY + 5);

      doc.font('Helvetica').fontSize(9).fillColor('#1E293B');
      doc.text(`Student Name:`, 50, studentBoxY + 30);
      doc.font('Helvetica-Bold').text(`${studentData.name}`, 150, studentBoxY + 30);

      doc.font('Helvetica').text(`Roll / Reg. No:`, 320, studentBoxY + 30);
      doc.font('Helvetica-Bold').text(`${studentData.registration_number}`, 420, studentBoxY + 30);

      doc.font('Helvetica').text(`Program / Degree:`, 50, studentBoxY + 50);
      doc.font('Helvetica-Bold').text(`${studentData.program || 'B.Tech Regular'}`, 150, studentBoxY + 50);

      doc.font('Helvetica').text(`Academic Year:`, 320, studentBoxY + 50);
      doc.font('Helvetica-Bold').text(`${studentData.academic_year || 'Final Year'}`, 420, studentBoxY + 50);

      doc.font('Helvetica').text(`Official Email:`, 50, studentBoxY + 70);
      doc.font('Helvetica-Bold').text(`${studentData.email}`, 150, studentBoxY + 70);

      // Certificate Body Text
      doc.y = studentBoxY + 105;
      doc.font('Helvetica').fontSize(10).fillColor('#1E293B').lineGap(4);

      let bodyText = '';
      if (docTypeData.code === 'BONAFIDE') {
        bodyText = `This is to certify that ${studentData.name} (Registration No: ${studentData.registration_number}) is a bona fide regular student of Apex Institute of Higher Education & Technology, enrolled in the Department of ${studentData.department_name || 'Engineering'}.\n\nAccording to institutional records, the student maintains satisfactory attendance and exemplary conduct. This certificate is issued upon the student's formal request for the following documented purpose: "${requestData.purpose}".\n\nThis certification remains valid for the current academic session from the date of issuance.`;
      } else if (docTypeData.code === 'TRANSCRIPT') {
        bodyText = `OFFICIAL STATEMENT OF ACADEMIC RECORD:\n\nThis is to certify that ${studentData.name} (Registration No: ${studentData.registration_number}) has maintained an approved curriculum schedule in the Department of ${studentData.department_name}.\n\nThe student has fulfilled all course prerequisites, laboratory assessments, and university examination requirements. All grades and cumulative grade point averages recorded in the college database have been verified by the department audit team and the Registrar's Office.\n\nPurpose of Request: ${requestData.purpose}`;
      } else if (docTypeData.code === 'LOR') {
        bodyText = `TO WHOMSOEVER IT MAY CONCERN:\n\nIt is my pleasure to endorse ${studentData.name} (Registration No: ${studentData.registration_number}), a distinguished student of our Department of ${studentData.department_name}.\n\nDuring their academic tenure at our institution, the candidate has exhibited exemplary problem-solving skills, academic rigor, and active participation in advanced seminars and project modules. The student is strongly recommended for their prospective endeavors in higher education or professional employment.\n\nPurpose stated by student: ${requestData.purpose}`;
      } else if (docTypeData.code === 'COURSE_COMPLETION') {
        bodyText = `PROVISIONAL DEGREE & COURSE COMPLETION CERTIFICATE:\n\nThis is to officially certify that ${studentData.name} (Registration No: ${studentData.registration_number}) has successfully satisfied all academic, practical, and viva-voce requirements prescribed for the degree program of ${studentData.program || 'B.Tech'}.\n\nAll departmental clearances, laboratory dues, and library obligations have been officially verified and settled.\n\nPurpose: ${requestData.purpose}`;
      } else {
        bodyText = `This document confirms and verifies the official academic standing of ${studentData.name} (Registration No: ${studentData.registration_number}) at Apex Institute of Higher Education & Technology.\n\nPurpose of Document: ${requestData.purpose}\nAdditional Remarks: ${requestData.additional_details || 'Verified against institutional databases.'}`;
      }

      doc.text(bodyText, 50, doc.y, { width: 495, align: 'justify' });

      // Official Stamp / Signature Section
      const signY = 640;
      doc.rect(40, signY, 515, 95).fillColor('#F8FAFC').fill();
      doc.rect(40, signY, 515, 95).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // Signatory 1
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A');
      doc.text('PREPARED & VERIFIED BY', 60, signY + 12);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text(`Digital Signer: ${approverUser ? approverUser.name : 'Academic Approver'}`, 60, signY + 28);
      doc.text(`Role: ${(approverUser ? approverUser.role : 'Authorized Staff').toUpperCase()}`, 60, signY + 40);
      doc.text(`Timestamp: ${new Date().toISOString()}`, 60, signY + 52);
      doc.text('[ INSTITUTIONALLY AUTHENTICATED ]', 60, signY + 68);

      // Signatory 2 (Registrar / Official Seal placeholder)
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A');
      doc.text('OFFICE OF THE REGISTRAR', 340, signY + 12);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text('Apex Institute of Higher Education & Technology', 340, signY + 28);
      doc.text('Official Seal: [ APEX / SEAL / VERIFIED ]', 340, signY + 40);
      doc.text('Issued electronically via Academic Document Workflow', 340, signY + 52);
      doc.fillColor('#0D9488').text('Signature Status: Validated Cryptographic Hash', 340, signY + 68);

      // Security Anti-Tamper Footer
      const footerY = 745;
      doc.rect(40, footerY, 515, 45).fillColor('#0F172A').fill();
      doc.fillColor('#94A3B8').fontSize(7).font('Helvetica');
      doc.text('SECURITY NOTICE: This is an official digitally generated academic document with verifiable credentials.', 50, footerY + 8);
      doc.text(`Verification Hash: ${verificationCode}`, 50, footerY + 19, { width: 495 });
      doc.text('Verify authenticity online at portal: http://localhost:5173/verify', 50, footerY + 30);

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          relativePath,
          documentNumber,
          verificationCode
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateOfficialPDF
};
