// evaluate.js
// Este script coleta as informações da avaliação, incluindo notas, comentários e fotos,
// gera um relatório PDF com as fotos e um arquivo CSV com apenas as notas/comentários.

// Mapeamento de rótulos para cada critério (usado no PDF e no gráfico)
const LABELS = {
  professores: 'Qualidade dos professores',
  alunos: 'Alunos por sala',
  metodo: 'Método de ensino',
  estrutura: 'Estrutura física',
  limpeza: 'Limpeza geral',
  convivencia: 'Espaço de convivência',
  esportes: 'Espaço para esportes',
  atividades: 'Atividades extracurriculares',
  distancia: 'Distância e acesso',
  seguranca: 'Segurança',
  custos: 'Custos e taxas',
  bolsas: 'Programas de bolsas',
  materiais: 'Valor do material didático',
  cantina: 'Cantina',
  reputacao: 'Reputação'
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('evaluationForm');
  const statusMessage = document.getElementById('statusMessage');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusMessage.style.color = 'black';
    statusMessage.textContent = 'Gerando relatórios...';
    const userName = form.userName.value.trim();
    const userEmail = form.userEmail.value.trim();
    const schoolName = form.schoolName.value.trim();
    if (!userName || !userEmail || !schoolName) {
      statusMessage.style.color = 'red';
      statusMessage.textContent = 'Preencha seu nome, e-mail e o nome da escola.';
      return;
    }
    // Lista de critérios e rótulos
    const criteria = {
      professores: 'Qualidade dos professores',
      alunos: 'Alunos por sala',
      metodo: 'Método de ensino',
      estrutura: 'Estrutura física',
      limpeza: 'Limpeza geral',
      convivencia: 'Espaço de convivência',
      esportes: 'Espaço para esportes',
      atividades: 'Atividades extracurriculares',
      distancia: 'Distância e acesso',
      seguranca: 'Segurança',
      custos: 'Custos e taxas',
      bolsas: 'Programas de bolsas',
      materiais: 'Valor do material didático',
      cantina: 'Cantina',
      reputacao: 'Reputação'
    };
    const scores = {};
    const comments = {};
    const photosData = {};
    // Coleta dados de cada critério
    for (const crit in criteria) {
      const scoreInput = form.elements[`${crit}_score`];
      const commentInput = form.elements[`${crit}_comment`];
      const photoInput = form.elements[`${crit}_photos`];
      const scoreVal = Number(scoreInput.value);
      if (Number.isNaN(scoreVal) || scoreVal < 1 || scoreVal > 10) {
        statusMessage.style.color = 'red';
        statusMessage.textContent = `Nota inválida para o critério ${criteria[crit]}.`;
        return;
      }
      scores[crit] = scoreVal;
      comments[crit] = commentInput.value.trim();
      // Fotos: compressão para DataURL
      const files = photoInput.files;
      const images = [];
      const uploadCount = Math.min(files.length, 3);
      for (let i = 0; i < uploadCount; i++) {
        const file = files[i];
        try {
          const dataUrl = await compressImage(file);
          images.push(dataUrl);
        } catch (err) {
          console.error('Erro ao processar imagem:', err);
        }
      }
      photosData[crit] = images;
    }
    // Observações gerais
    const observacoes = form.elements['observacoes_comment'].value.trim();
    // Monta objeto de avaliação
    const evaluation = {
      userName,
      userEmail,
      school: schoolName,
      timestamp: new Date().toLocaleString(),
      scores,
      comments,
      photos: photosData,
      observacoes
    };
    try {
      await generatePdfReport(evaluation);
      statusMessage.style.color = 'green';
      statusMessage.textContent = 'Relatório gerado com sucesso! Verifique seu download.';
      form.reset();
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      statusMessage.style.color = 'red';
      statusMessage.textContent = 'Erro ao gerar relatório: ' + err.message;
    }
  });
});

// Redimensiona e comprime imagens usando canvas
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Qualidade 0.7 para reduzir tamanho
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Gera PDF contendo notas, comentários e fotos
async function generatePdfReport(evaluation) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;
  doc.setFontSize(14);
  doc.text(`Relatório de Avaliação`, margin, y);
  y += 18;
  doc.setFontSize(12);
  doc.text(`Escola: ${evaluation.school}`, margin, y);
  y += 14;
  doc.text(`Avaliador: ${evaluation.userName} (${evaluation.userEmail})`, margin, y);
  y += 14;
  doc.text(`Data: ${evaluation.timestamp}`, margin, y);
  y += 20;
  doc.setFontSize(11);
  for (const crit in evaluation.scores) {
    const critName = crit;
    const label = LABELS[critName] || critName;
    const score = evaluation.scores[crit];
    const comment = evaluation.comments[crit];
    const photos = evaluation.photos[crit] || [];
    // Título do critério
    doc.setFont(undefined, 'bold');
    doc.text(`${label}`, margin, y);
    doc.setFont(undefined, 'normal');
    y += 14;
    doc.text(`Nota: ${score}`, margin + 10, y);
    y += 12;
    if (comment) {
      // Comentário: quebra em linhas se necessário
      const commentLines = doc.splitTextToSize(`Comentário: ${comment}`, doc.internal.pageSize.getWidth() - 2 * margin);
      doc.text(commentLines, margin + 10, y);
      y += commentLines.length * 12;
    }
    // Fotos
    for (const dataUrl of photos) {
      const img = await loadImage(dataUrl);
      const imgProps = doc.getImageProperties(dataUrl);
      const maxWidth = 200;
      let imgW = maxWidth;
      let imgH = (imgProps.height * maxWidth) / imgProps.width;
      if (imgH > 150) {
        imgH = 150;
        imgW = (imgProps.width * 150) / imgProps.height;
      }
      if (y + imgH > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.addImage(dataUrl, 'JPEG', margin + 20, y, imgW, imgH);
      y += imgH + 8;
    }
    y += 14;
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Observações gerais
  if (evaluation.observacoes && evaluation.observacoes.trim().length > 0) {
    if (y > doc.internal.pageSize.getHeight() - margin * 2) {
      doc.addPage();
      y = margin;
    }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Observações gerais', margin, y);
    y += 14;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const obsLines = doc.splitTextToSize(evaluation.observacoes, doc.internal.pageSize.getWidth() - 2 * margin);
    doc.text(obsLines, margin, y);
    y += obsLines.length * 12;
  }
  // Desenha gráfico de barras comparativo (nota vs referência 6)
  try {
    const barLabels = {
      professores: 'Professores',
      metodo: 'Método',
      estrutura: 'Estrutura',
      limpeza: 'Limpeza',
      atividades: 'Atividades',
      distancia: 'Distância',
      custos: 'Custos',
      seguranca: 'Segurança',
      reputacao: 'Reputação'
    };
    const barWidth = 200;
    const barHeight = 10;
    const baselineValue = 6;
    // Verifica se há espaço suficiente, senão adiciona nova página
    const neededHeight = Object.keys(evaluation.scores).length * 18 + 30;
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Comparação de Notas (barra azul = nota, barra cinza = referência 6)', margin, y);
    y += 16;
    for (const key in evaluation.scores) {
      const score = evaluation.scores[key];
      const label = barLabels[key] || key;
      // Desenha barra base (referência)
      doc.setFillColor(200, 200, 200);
      doc.rect(margin + 150, y - 6, (baselineValue / 10) * barWidth, barHeight, 'F');
      // Desenha barra de pontuação
      doc.setFillColor(0, 123, 255);
      doc.rect(margin + 150, y - 6, (score / 10) * barWidth, barHeight, 'F');
      // Texto do critério
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(label, margin, y);
      y += 18;
    }
  } catch (err) {
    console.error('Erro ao desenhar gráfico de barras:', err);
  }
  // Após listar todos os critérios, adiciona uma página de comparação visual
  // Desenho de um gráfico de barras comparando as notas com a referência 6
  try {
    // Adiciona nova página para o gráfico se não houver espaço suficiente
    if (y > doc.internal.pageSize.getHeight() - margin * 2) {
      doc.addPage();
      y = margin;
    }
    // Título do gráfico
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Comparação visual das notas (referência 6)', margin, y);
    y += 18;
    doc.setFont(undefined, 'normal');
    // Configurações do gráfico
    const chartX = margin;
    const chartYStart = y;
    const chartWidth = doc.internal.pageSize.getWidth() - margin * 2 - 150;
    const barHeight = 12;
    const barGap = 14;
    // Percorre cada critério na ordem predefinida
    const order = ['professores','alunos','metodo','estrutura','limpeza','convivencia','esportes','atividades','distancia','seguranca','custos','bolsas','materiais','cantina','reputacao'];
    order.forEach((key, index) => {
      const score = evaluation.scores[key];
      const baseRef = 6;
      const baselineWidth = (baseRef / 10) * chartWidth;
      const valueWidth = (score / 10) * chartWidth;
      const yPos = chartYStart + index * (barHeight + barGap);
      // Desenha barra de referência (cinza claro)
      doc.setFillColor(220, 220, 220);
      doc.rect(chartX, yPos, baselineWidth, barHeight, 'F');
      // Desenha barra do valor (azul)
      doc.setFillColor(70, 130, 180);
      doc.rect(chartX, yPos, valueWidth, barHeight, 'F');
      // Label do critério
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const critLabel = LABELS[key] || key;
      doc.text(critLabel, chartX + chartWidth + 8, yPos + barHeight - 2);
    });
    y = chartYStart + order.length * (barHeight + barGap) + 10;
  } catch (err) {
    console.warn('Erro ao desenhar gráfico de barras:', err);
  }

  // Adiciona linha CSV no final do PDF para fácil cópia em planilha
  try {
    // Prepara cabeçalhos e linha de valores na mesma ordem do CSV original
    const headers = [
      'Escola','Avaliador','E-mail','Data',
      'Professores','Comentário Professores',
      'Alunos por sala','Comentário Alunos por sala',
      'Método','Comentário Método',
      'Estrutura','Comentário Estrutura',
      'Limpeza','Comentário Limpeza',
      'Espaço de convivência','Comentário Espaço de convivência',
      'Espaço para esportes','Comentário Espaço para esportes',
      'Atividades','Comentário Atividades',
      'Distância','Comentário Distância',
      'Segurança','Comentário Segurança',
      'Custos','Comentário Custos',
      'Programas de bolsas','Comentário Programas de bolsas',
      'Valor do material didático','Comentário Valor do material didático',
      'Cantina','Comentário Cantina',
      'Reputação','Comentário Reputação'
    ];
    const values = [];
    values.push(evaluation.school);
    values.push(evaluation.userName);
    values.push(evaluation.userEmail);
    values.push(evaluation.timestamp);
    const orderKeys = ['professores','alunos','metodo','estrutura','limpeza','convivencia','esportes','atividades','distancia','seguranca','custos','bolsas','materiais','cantina','reputacao'];
    orderKeys.forEach(key => {
      values.push(evaluation.scores[key]);
      values.push(evaluation.comments[key] || '');
    });
    const csvLine = values.map(v => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      // Envolvemos com aspas duplas para preservar vírgulas internas
      return '"' + s + '"';
    }).join(',');
    // Se necessário, adiciona nova página
    if (y > doc.internal.pageSize.getHeight() - margin * 4) {
      doc.addPage();
      y = margin;
    }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Linha para planilha (copie e cole no Excel)', margin, y);
    y += 14;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    // Quebra a linha CSV em múltiplas linhas para caber na página
    const csvWrapped = doc.splitTextToSize(csvLine, doc.internal.pageSize.getWidth() - margin * 2);
    doc.text(csvWrapped, margin, y);
    y += csvWrapped.length * 10;
  } catch (err) {
    console.warn('Erro ao adicionar linha CSV no PDF:', err);
  }

  // Salva o PDF
  const fileName = `${evaluation.school.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Gera CSV com notas e comentários
function generateCsvReport(evaluation) {
  // Cabeçalho
  const headers = [
    'Escola','Avaliador','E-mail','Data',
    'Professores','Comentário Professores',
    'Método','Comentário Método',
    'Estrutura','Comentário Estrutura',
    'Limpeza','Comentário Limpeza',
    'Atividades','Comentário Atividades',
    'Distância','Comentário Distância',
    'Custos','Comentário Custos',
    'Segurança','Comentário Segurança',
    'Reputação','Comentário Reputação'
  ];
  const row = [];
  row.push(evaluation.school);
  row.push(evaluation.userName);
  row.push(evaluation.userEmail);
  row.push(evaluation.timestamp);
  // Adiciona notas e comentários para cada critério na ordem definida
  const order = ['professores','metodo','estrutura','limpeza','atividades','distancia','custos','seguranca','reputacao'];
  order.forEach(key => {
    row.push(evaluation.scores[key]);
    row.push(evaluation.comments[key] || '');
  });
  // Constrói CSV
  const csvLines = [];
  csvLines.push(headers.join(','));
  csvLines.push(row.map(value => {
    // Escapa aspas e vírgulas
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }).join(','));
  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const fileName = `${evaluation.school.replace(/\s+/g, '_')}_${Date.now()}.csv`;
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}