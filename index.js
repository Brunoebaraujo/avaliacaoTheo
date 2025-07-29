// index.js
// Carrega avaliações, exibe médias por escola e gera relatórios em PDF e Excel.

document.addEventListener('DOMContentLoaded', async () => {
  const resultsContainer = document.getElementById('resultsContainer');
  const pdfBtn = document.getElementById('pdfReportBtn');
  const excelBtn = document.getElementById('excelReportBtn');
  const allEvaluations = [];
  try {
    const snapshot = await db.collection('evaluations').get();
    if (snapshot.empty) {
      resultsContainer.innerHTML = '<p>Nenhuma avaliação registrada ainda.</p>';
      pdfBtn.disabled = true;
      excelBtn.disabled = true;
      return;
    }
    const schoolData = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      allEvaluations.push({ id: doc.id, ...data });
      const school = data.school;
      const scores = data.scores;
      if (!schoolData[school]) {
        schoolData[school] = { count: 0, sums: {} };
      }
      schoolData[school].count++;
      for (const crit in scores) {
        const num = Number(scores[crit]);
        if (!Number.isNaN(num)) {
          schoolData[school].sums[crit] = (schoolData[school].sums[crit] || 0) + num;
        }
      }
    });
    resultsContainer.innerHTML = '';
    for (const school in schoolData) {
      const info = schoolData[school];
      const avgScores = {};
      for (const crit in info.sums) {
        avgScores[crit] = (info.sums[crit] / info.count).toFixed(2);
      }
      const schoolDiv = document.createElement('div');
      schoolDiv.className = 'school-result';
      const title = document.createElement('h3');
      title.textContent = school;
      schoolDiv.appendChild(title);
      const table = document.createElement('table');
      table.innerHTML = '<thead><tr><th>Critério</th><th>Média</th></tr></thead>';
      const tbody = document.createElement('tbody');
      const critLabels = {
        professores: 'Qualidade dos professores',
        metodo: 'Método de ensino',
        estrutura: 'Estrutura física',
        limpeza: 'Limpeza geral',
        atividades: 'Atividades extracurriculares',
        distancia: 'Distância e acesso',
        custos: 'Custos e taxas',
        seguranca: 'Segurança',
        reputacao: 'Reputação'
      };
      for (const crit in avgScores) {
        const tr = document.createElement('tr');
        const tdCrit = document.createElement('td');
        tdCrit.textContent = critLabels[crit] || crit;
        const tdAvg = document.createElement('td');
        tdAvg.textContent = avgScores[crit];
        tr.appendChild(tdCrit);
        tr.appendChild(tdAvg);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      schoolDiv.appendChild(table);
      resultsContainer.appendChild(schoolDiv);
    }
  } catch (error) {
    console.error('Erro ao carregar resultados:', error);
    resultsContainer.innerHTML = '<p>Ocorreu um erro ao carregar os resultados.</p>';
    pdfBtn.disabled = true;
    excelBtn.disabled = true;
  }
  pdfBtn.addEventListener('click', async () => {
    pdfBtn.disabled = true;
    pdfBtn.textContent = 'Gerando PDF...';
    try {
      await generatePdfReport(allEvaluations);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
    pdfBtn.disabled = false;
    pdfBtn.textContent = 'Gerar relatório PDF (com fotos)';
  });
  excelBtn.addEventListener('click', () => {
    generateExcelReport(allEvaluations);
  });
});

async function generatePdfReport(evaluations) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;
  for (let idx = 0; idx < evaluations.length; idx++) {
    const evalData = evaluations[idx];
    doc.setFontSize(12);
    const header = `Escola: ${evalData.school} | Avaliador: ${evalData.userName} (${evalData.userEmail})`;
    doc.text(header, margin, y);
    y += 14;
    const date = evalData.timestamp && evalData.timestamp.toDate ? evalData.timestamp.toDate().toLocaleString() : '';
    doc.text(`Data: ${date}`, margin, y);
    y += 14;
    doc.setFontSize(10);
    const critLabels = {
      professores: 'Professores',
      metodo: 'Método',
      estrutura: 'Estrutura',
      atividades: 'Atividades',
      distancia: 'Distância',
      custos: 'Custos',
      seguranca: 'Segurança',
      reputacao: 'Reputação',
      inclusao: 'Inclusão'
    };
    for (const crit in evalData.scores) {
      doc.text(`${critLabels[crit] || crit}: ${evalData.scores[crit]}`, margin + 10, y);
      y += 12;
    }
    // Inserir fotos
    for (const crit in evalData.photoUrls) {
      const photos = evalData.photoUrls[crit];
      if (photos && photos.length) {
        for (let i = 0; i < photos.length; i++) {
          const url = photos[i];
          try {
            const dataUrl = await toDataURL(url);
            const imgProps = doc.getImageProperties(dataUrl);
            const maxDim = 150;
            let imgW = maxDim;
            let imgH = (imgProps.height * maxDim) / imgProps.width;
            if (imgH > maxDim) {
              imgH = maxDim;
              imgW = (imgProps.width * maxDim) / imgProps.height;
            }
            if (y + imgH > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.addImage(dataUrl, 'JPEG', margin, y, imgW, imgH);
            y += imgH + 5;
          } catch (err) {
            console.error('Erro ao carregar imagem para PDF:', err);
          }
        }
      }
    }
    y += 20;
    if (idx < evaluations.length - 1 && y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }
  doc.save('relatorio_avaliacoes.pdf');
}

async function toDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateExcelReport(evaluations) {
  const wsData = [];
  const header = ['Escola','Avaliador','E-mail','Data','Professores','Método','Estrutura','Atividades','Distância','Custos','Segurança','Reputação','Inclusão'];
  wsData.push(header);
  evaluations.forEach(evalData => {
    const row = [];
    row.push(evalData.school);
    row.push(evalData.userName);
    row.push(evalData.userEmail);
    const date = evalData.timestamp && evalData.timestamp.toDate ? evalData.timestamp.toDate().toLocaleString() : '';
    row.push(date);
    row.push(evalData.scores.professores);
    row.push(evalData.scores.metodo);
    row.push(evalData.scores.estrutura);
    row.push(evalData.scores.atividades);
    row.push(evalData.scores.distancia);
    row.push(evalData.scores.custos);
    row.push(evalData.scores.seguranca);
    row.push(evalData.scores.reputacao);
    row.push(evalData.scores.inclusao);
    wsData.push(row);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
  XLSX.writeFile(wb, 'avaliacoes.xlsx');
}