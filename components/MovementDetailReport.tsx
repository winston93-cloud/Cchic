'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

interface MovementDetailReportProps {
  onClose: () => void;
}

interface GroupedData {
  person: string;
  categories: {
    category: string;
    icon?: string;
    color?: string;
    movements: Expense[];
    subtotal: number;
  }[];
  total: number;
}

export default function MovementDetailReport({ onClose }: MovementDetailReportProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories (name, icon, color)
        `)
        .eq('status', 'active')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('correspondent_to')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = (data || []).map((exp: any) => ({
        id: exp.id,
        date: exp.date,
        correspondent_to: exp.correspondent_to || 'Sin asignar',
        executor: exp.executor,
        category_id: exp.category_id,
        amount: exp.amount,
        voucher_number: exp.voucher_number,
        notes: exp.notes,
        status: exp.status,
        category_name: exp.categories?.name || 'Sin categoría',
        category_icon: exp.categories?.icon,
        category_color: exp.categories?.color,
      }));

      // Agrupar por persona y categoría
      const grouped: { [key: string]: GroupedData } = {};
      let total = 0;

      formattedExpenses.forEach((expense: Expense) => {
        const person = expense.correspondent_to || 'Sin asignar';
        const category = expense.category_name || 'Sin categoría';

        if (!grouped[person]) {
          grouped[person] = {
            person,
            categories: [],
            total: 0
          };
        }

        let categoryGroup = grouped[person].categories.find(c => c.category === category);
        if (!categoryGroup) {
          categoryGroup = {
            category,
            icon: expense.category_icon,
            color: expense.category_color,
            movements: [],
            subtotal: 0
          };
          grouped[person].categories.push(categoryGroup);
        }

        categoryGroup.movements.push(expense);
        categoryGroup.subtotal += expense.amount;
        grouped[person].total += expense.amount;
        total += expense.amount;
      });

      setGroupedData(Object.values(grouped));
      setGrandTotal(total);
      setShowReport(true);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      alert('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const data: any[] = [];
      
      // Título
      data.push(['REPORTE DE DETALLE DE MOVIMIENTOS']);
      data.push([`Del ${formatDate(startDate)} al ${formatDate(endDate)}`]);
      data.push([]);
      data.push([]);

      groupedData.forEach((personGroup) => {
        // Persona (destacada)
        data.push([`PERSONA: ${personGroup.person}`, '', '', '', '']);
        data.push([]);

        personGroup.categories.forEach((catGroup) => {
          // Categoría
          data.push([`  📁 ${catGroup.category}`, '', '', '', `${formatCurrency(catGroup.subtotal)}`]);
          data.push(['    Fecha', 'Recibo', 'Concepto', '', 'Monto']);
          
          // Movimientos
          catGroup.movements.forEach((mov) => {
            data.push([
              '    ' + formatDate(mov.date),
              mov.voucher_number,
              mov.notes || '-',
              '',
              mov.amount
            ]);
          });

          // Subtotal de categoría
          data.push(['', '', '', `Subtotal ${catGroup.category}:`, catGroup.subtotal]);
          data.push([]);
        });

        // Total por persona
        data.push(['', '', '', `TOTAL ${personGroup.person}:`, personGroup.total]);
        data.push([]);
        data.push([]);
      });

      // Gran total
      data.push(['', '', '', 'GRAN TOTAL:', grandTotal]);

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Estilos y anchos de columna
      ws['!cols'] = [
        { wch: 15 }, // Fecha
        { wch: 12 }, // Recibo
        { wch: 50 }, // Concepto
        { wch: 25 }, // Categoría/Etiquetas
        { wch: 15 }  // Monto
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
      
      // Generar blob y abrir en nueva ventana
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva pestaña (el navegador lo descargará automáticamente)
      const link = document.createElement('a');
      link.href = url;
      link.download = `Detalle_Movimientos_${startDate}_${endDate}.xlsx`;
      link.target = '_blank';
      link.click();
      
      // Limpiar URL después de un momento
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel');
    }
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE DETALLE DE MOVIMIENTOS', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Del ${formatDate(startDate)} al ${formatDate(endDate)}`, 105, 22, { align: 'center' });

    let yPos = 30;

    groupedData.forEach((personGroup, personIndex) => {
      // Nueva página si es necesario
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Persona
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(102, 126, 234);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`${personGroup.person}`, 16, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      personGroup.categories.forEach((catGroup) => {
        // Categoría
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(200, 200, 200);
        doc.rect(14, yPos, 182, 6, 'F');
        doc.text(`  ${catGroup.category}`, 16, yPos + 4);
        yPos += 8;

        // Tabla de movimientos
        const tableData = catGroup.movements.map(mov => [
          formatDate(mov.date),
          mov.voucher_number,
          mov.notes || '-',
          formatCurrency(mov.amount)
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['Fecha', 'Recibo', 'Concepto', 'Monto']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [118, 75, 162], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 25 },
            2: { cellWidth: 90 },
            3: { cellWidth: 30, halign: 'right' }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 2;

        // Subtotal de categoría
        doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal ${catGroup.category}:`, 160, yPos, { align: 'right' });
        doc.text(formatCurrency(catGroup.subtotal), 190, yPos, { align: 'right' });
        yPos += 6;
      });

      // Total por persona
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(220, 220, 220);
      doc.rect(130, yPos, 66, 6, 'F');
      doc.text(`TOTAL ${personGroup.person}:`, 160, yPos + 4, { align: 'right' });
      doc.text(formatCurrency(personGroup.total), 190, yPos + 4, { align: 'right' });
      yPos += 12;
    });

    // Gran total
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(102, 126, 234);
    doc.setTextColor(255, 255, 255);
    doc.rect(130, yPos, 66, 8, 'F');
    doc.text('GRAN TOTAL:', 160, yPos + 5.5, { align: 'right' });
    doc.text(formatCurrency(grandTotal), 190, yPos + 5.5, { align: 'right' });

    // Abrir PDF en nueva ventana/pestaña
    doc.output('dataurlnewwindow', { filename: `Detalle_Movimientos_${startDate}_${endDate}.pdf` });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <motion.div 
        className="modal-overlay" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="modal" 
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ 
            maxWidth: showReport ? '95vw' : '600px', 
            maxHeight: '95vh', 
            overflowY: 'auto',
            transition: 'max-width 0.3s ease'
          }}
        >
          <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Detalle de Movimientos
            </h2>
            <motion.button 
              className="modal-close" 
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          {!showReport ? (
            // FORMULARIO DE FECHAS
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem'
                }}
              >
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '1.5rem', 
                  color: 'var(--primary-blue)',
                  fontWeight: '600'
                }}>
                  📅 Selecciona el rango de fechas
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      🟢 Desde
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input"
                      style={{ 
                        padding: '0.8rem', 
                        fontSize: '0.95rem',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      🔴 Hasta
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input"
                      style={{ 
                        padding: '0.8rem', 
                        fontSize: '0.95rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchMovements}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading 
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? '⏳ Generando...' : '📊 Generar Reporte'}
                </motion.button>
              </motion.div>

              <div style={{
                padding: '1.5rem',
                background: 'rgba(0, 229, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 229, 255, 0.2)'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
                  💡 <strong>Tip:</strong> El reporte se generará agrupado por persona y categoría, con subtotales y gran total.
                </div>
              </div>
            </div>
          ) : (
            // REPORTE GENERADO
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ padding: '0 1.5rem 1.5rem' }}
              >
                {/* Header del reporte */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        📊 Reporte de Movimientos
                      </h3>
                      <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                        Del {formatDate(startDate)} al {formatDate(endDate)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exportToPDF}
                        style={{
                          padding: '0.6rem 1.2rem',
                          background: 'rgba(255, 23, 68, 0.9)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        📄 PDF
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exportToExcel}
                        style={{
                          padding: '0.6rem 1.2rem',
                          background: 'rgba(0, 230, 118, 0.9)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        📊 Excel
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Datos agrupados */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {groupedData.map((personGroup, personIndex) => (
                    <motion.div
                      key={personIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: personIndex * 0.1 }}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        marginBottom: '1.5rem'
                      }}
                    >
                      {/* Persona Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '1rem 1.5rem',
                        color: 'white'
                      }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                          👤 {personGroup.person}
                        </h4>
                      </div>

                      {/* Categorías */}
                      {personGroup.categories.map((catGroup, catIndex) => (
                        <div key={catIndex} style={{ padding: '1rem 1.5rem', borderBottom: catIndex < personGroup.categories.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.8rem',
                            padding: '0.6rem',
                            background: 'rgba(102, 126, 234, 0.05)',
                            borderRadius: '8px'
                          }}>
                            <span style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: catGroup.color || '#4da6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem'
                            }}>
                              {catGroup.icon || '📦'}
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: '600', flex: 1 }}>
                              {catGroup.category}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                              {formatCurrency(catGroup.subtotal)}
                            </span>
                          </div>

                          {/* Movimientos de la categoría */}
                          <div style={{ paddingLeft: '1rem' }}>
                            {catGroup.movements.map((mov, movIndex) => (
                              <div
                                key={mov.id}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '100px 90px 1fr 120px',
                                  gap: '1rem',
                                  padding: '0.6rem 0',
                                  borderBottom: movIndex < catGroup.movements.length - 1 ? '1px dashed rgba(0,0,0,0.05)' : 'none',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <div>{formatDate(mov.date)}</div>
                                <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {mov.voucher_number}
                                </div>
                                <div style={{ color: 'var(--gray-600)' }}>
                                  {mov.notes || '-'}
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary-blue)' }}>
                                  {formatCurrency(mov.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Total por persona */}
                      <div style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                          TOTAL {personGroup.person}
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                          {formatCurrency(personGroup.total)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Gran Total */}
                <div style={{
                  background: 'linear-gradient(135deg, #FF1744 0%, #D32F2F 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                    💰 GRAN TOTAL
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                {/* Botones de acción */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '1.5rem',
                  justifyContent: 'space-between'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReport(false)}
                    style={{
                      flex: 1,
                      padding: '0.9rem',
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'var(--gray-700)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ← Nueva Consulta
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '0.9rem',
                      background: 'linear-gradient(135deg, #00E5FF 0%, #1976D2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
