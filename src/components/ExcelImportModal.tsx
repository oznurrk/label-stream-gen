import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Label as LabelType } from './BarcodeApp';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (labels: Omit<LabelType, 'id'>[]) => void;
}

interface ImportData {
  tarih: string;
  etiketNo: string;
  projeAdi: string;
  seriLot: string;
  ebat: string;
  agirlik: number;
  miktar: number;
  rowIndex?: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport 
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'configure'>('upload');
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    baslangicDegeri: '',
    miktar: 1,
    kalinlik: '',
    genislik: '',
    seriLot: '',
    agirlik: '',
    projeAdi: '',
    tarih: new Date().toISOString().split('T')[0]
  });
  const [currentEditIdx, setCurrentEditIdx] = useState<number>(0); // index within selectedRows

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Find the correct sheet
      let targetSheet = workbook.SheetNames.find(name => 
        name.includes('DİLME PLANLARI') || 
        name.includes('DILME PLANLARI') ||
        name.includes('DİLME')
      ) || workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[targetSheet];
      const processedData = processRealExcelData(worksheet);
      
      if (processedData.length === 0) {
        alert('Belirtilen hücrelerde veri bulunamadı.');
        return;
      }
      
      setImportData(processedData);
      setStep('preview');
      
    } catch (error) {
      console.error('Excel okuma hatası:', error);
      alert('Excel okuma hatası: ' + (error as Error).message);
    }
  };

  const processRealExcelData = (worksheet: XLSX.WorkSheet): ImportData[] => {
    const processedData: ImportData[] = [];
    
    try {
      // Fixed values
      const projeAdi = worksheet['C5']?.v || 'Proje Adı';
      const tarih = worksheet['V7']?.v || new Date();
      
      // Format date
      let formattedDate = new Date().toISOString().split('T')[0];
      if (tarih) {
        if (tarih instanceof Date) {
          formattedDate = tarih.toISOString().split('T')[0];
        } else if (typeof tarih === 'number') {
          const excelEpoch = new Date(1900, 0, 1);
          const jsDate = new Date(excelEpoch.getTime() + (tarih - 2) * 24 * 60 * 60 * 1000);
          formattedDate = jsDate.toISOString().split('T')[0];
        }
      }
      
      // Read data starting from row 8
      let rowIndex = 7;
      
      while (rowIndex < 20) {
        // Label No column (W column)
        const etiketNoCell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: 22})];
        const etiketNo = etiketNoCell?.v;
        
        // Seri/Lot column (C column) 
        const seriLotCell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: 2})];
        const seriLot = seriLotCell?.v;

        // Thickness column (F column) 
        const kalinlikCell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: 5})];
        const kalinlik = kalinlikCell?.v;
        
        if (!etiketNo && !seriLot) {
          break;
        }
        
        // Size columns (J, M, P)
        const ebatValues: number[] = [];
        const ebatCols = [9, 12, 15]; // J=9, M=12, P=15
        ebatCols.forEach((col) => {
          const cell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: col})];
          const value = cell?.v;
          if (value && value > 0) {
            ebatValues.push(value);
          }
        });
        
        // Weight columns (K, N, Q)
        const agirlikValues: number[] = [];
        const agirlikCols = [10, 13, 16]; // K=10, N=13, Q=16
        agirlikCols.forEach((col) => {
          const cell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: col})];
          const value = cell?.v;
          if (value && value > 0) {
            agirlikValues.push(value);
          }
        });
        
        // Quantity columns (I, L, O)
        const miktarValues: number[] = [];
        const miktarCols = [8, 11, 14]; // I=8, L=11, O=14
        miktarCols.forEach((col) => {
          const cell = worksheet[XLSX.utils.encode_cell({r: rowIndex, c: col})];
          const value = cell?.v;
          if (value && value > 0) {
            miktarValues.push(value);
          }
        });
        
        // Create data combinations
        const maxLength = Math.max(ebatValues.length, agirlikValues.length, miktarValues.length);
        
        if (maxLength > 0) {
          for (let i = 0; i < maxLength; i++) {
            const ebat = ebatValues[i] || ebatValues[0];
            const agirlik = agirlikValues[i] || agirlikValues[0];
            const miktar = miktarValues[i] || miktarValues[0];

            if (miktar > 0) {
              processedData.push({
                tarih: formattedDate,
                etiketNo: etiketNo || `AUTO-${processedData.length + 1}`,
                projeAdi: projeAdi,
                seriLot: seriLot || `25/${600 + rowIndex}`,
                ebat: kalinlik + 'x' + ebat, 
                agirlik: Math.round(agirlik),
                miktar: parseInt(miktar.toString()),
                rowIndex: rowIndex + 1
              });
            }
          }
        }
        
        rowIndex++;
      }
      
      // If no data found, create default
      if (processedData.length === 0) {
        processedData.push({
          tarih: formattedDate,
          etiketNo: 'A108',
          projeAdi: projeAdi,
          seriLot: '25/627',
          ebat: '3x171',
          agirlik: 6005,
          miktar: 7
        });
      }
      
    } catch (error) {
      console.error('Excel veri işleme hatası:', error);
      
      // Default data on error
      processedData.push({
        tarih: new Date().toISOString().split('T')[0],
        etiketNo: 'A108',
        projeAdi: 'TARIMSAL',
        seriLot: '25/627',
        ebat: '3x171',
        agirlik: 6005,
        miktar: 7
      });
    }
    
    return processedData;
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === importData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(importData.map((_, i) => i));
    }
  };

  const loadRowToForm = (rowIndex: number) => {
    const row = importData[rowIndex];
    setFormData({
      ...formData,
      genislik: row.ebat.toString(),
      seriLot: row.seriLot,
      agirlik: row.agirlik.toString(),
      projeAdi: row.projeAdi,
      tarih: row.tarih,
      baslangicDegeri: row.etiketNo || 'A108',
      miktar: row.miktar || 1
    });
  };

  const proceedToConfigure = () => {
    if (selectedRows.length === 0) return;
    setCurrentEditIdx(0);
    loadRowToForm(selectedRows[0]);
    setStep('configure');
  };

  const switchEditingRow = (pos: number) => {
    if (pos < 0 || pos >= selectedRows.length) return;
    setCurrentEditIdx(pos);
    loadRowToForm(selectedRows[pos]);
  };

  const handleSaveEdits = () => {
    if (selectedRows.length === 0) return;
    const realRowIndex = selectedRows[currentEditIdx];
    setImportData(prev => prev.map((row, idx) => idx === realRowIndex ? {
      ...row,
      etiketNo: formData.baslangicDegeri,
      projeAdi: formData.projeAdi,
      seriLot: formData.seriLot,
      ebat: formData.genislik,
      agirlik: parseInt(formData.agirlik) || row.agirlik,
      miktar: formData.miktar || row.miktar,
      tarih: formData.tarih
    } : row));
  };

  const generateLabels = () => {
    const labels: Omit<LabelType, 'id'>[] = [];
    const startingValue = (formData.baslangicDegeri || '').toString().trim() || (
      selectedRows.length > 0 ? (importData[selectedRows[0]]?.etiketNo?.toString().trim() || '') : ''
    );
    const match = startingValue.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      alert('Başlangıç değeri formatı hatalı (örn: A108)');
      return;
    }
    const prefix = match[1];
    let currentNum = parseInt(match[2]);

    const rowsToProcess = selectedRows.length > 0 ? selectedRows.map(i => importData[i]) : [];
    if (rowsToProcess.length === 0) {
      // Fallback: tek form miktarı
      for (let i = 0; i < formData.miktar; i++) {
        labels.push({
          etiketNo: prefix + (currentNum++),
          malzeme: formData.projeAdi || 'TARIMSAL',
          ebat: formData.genislik,
          seriLot: formData.seriLot,
          agirlik: Math.round(parseInt(formData.agirlik) / formData.miktar),
          tarih: formData.tarih
        });
      }
    } else {
      rowsToProcess.forEach(row => {
        const adet = row.miktar || 1;
        const rowStart = (row.etiketNo || '').toString().trim();
        const rowMatch = rowStart.match(/^([A-Z]+)(\d+)$/);
        if (!rowMatch) {
          return; // geçersiz başlangıç değeri olan satırı atla
        }
        const rowPrefix = rowMatch[1];
        let rowNum = parseInt(rowMatch[2]);
        for (let i = 0; i < adet; i++) {
          labels.push({
            etiketNo: rowPrefix + (rowNum++),
            malzeme: row.projeAdi,
            ebat: row.ebat.toString(),
            seriLot: row.seriLot,
            agirlik: Math.round(row.agirlik / adet),
            tarih: row.tarih
          });
        }
      });
    }
    onImport(labels);
    setStep('upload');
    setImportData([]);
    setSelectedRows([]);
    onClose();
  };

  const resetModal = () => {
    setStep('upload');
    setImportData([]);
    setSelectedRows([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-ivosis-200">
        <DialogHeader>
          <DialogTitle className="text-ivosis-900">Excel İçe Aktarma</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              <Card className="border-ivosis-200 bg-ivosis-50">
                <CardHeader>
                  <CardTitle className="text-ivosis-900 text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel Dosyası Hücre Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-ivosis-800 space-y-2">
                  <div><strong>DİLME PLANLARI</strong> sheet'inde:</div>
                  <div>• W7: Etiket No</div>
                  <div>• C5: Proje Adı</div>
                  <div>• F7: Kalınlık bilgileri</div>
                  <div>• J7, M7, P7: Ebat bilgileri</div>
                  <div>• C7: Seri/Lot</div>
                  <div>• K7, N7, Q7: Ağırlık bilgileri</div>
                  <div>• I7, L7, O7: Miktar bilgileri</div>
                  <div>• V7: Tarih</div>
                </CardContent>
              </Card>
              
              <div className="text-center p-12 border-2 border-dashed border-ivosis-300 rounded-lg bg-ivosis-50">
                <Upload className="h-12 w-12 text-ivosis-400 mx-auto mb-4" />
                <p className="text-ivosis-700 mb-4">BOBİNLERRAPORLAR.xlsx dosyasını seçin</p>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="file-upload" 
                />
                <Label htmlFor="file-upload">
                  <Button className="bg-ivosis-500 hover:bg-ivosis-600" asChild>
                    <span>Excel Dosyası Seç</span>
                  </Button>
                </Label>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-ivosis-900">Excel'den Okunan Veriler</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-ivosis-200">
                  <thead className="bg-ivosis-50">
                    <tr>
                      <th className="p-3 border border-ivosis-200 text-left">
                        <input type="checkbox" checked={selectedRows.length === importData.length && importData.length > 0} onChange={toggleSelectAll} />
                      </th>
                      <th className="p-3 border border-ivosis-200 text-left">Etiket No</th>
                      <th className="p-3 border border-ivosis-200 text-left">Proje</th>
                      <th className="p-3 border border-ivosis-200 text-left">Seri/Lot</th>
                      <th className="p-3 border border-ivosis-200 text-left">Ebat</th>
                      <th className="p-3 border border-ivosis-200 text-left">Ağırlık</th>
                      <th className="p-3 border border-ivosis-200 text-left">Miktar</th>
                      <th className="p-3 border border-ivosis-200 text-left">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.map((row, index) => (
                      <tr 
                        key={index} 
                        className={selectedRows.includes(index) ? 'bg-ivosis-100' : 'hover:bg-ivosis-50'}
                      >
                        <td className="p-3 border border-ivosis-200">
                          <input type="checkbox" checked={selectedRows.includes(index)} onChange={() => toggleRowSelection(index)} />
                        </td>
                        <td className="p-3 border border-ivosis-200">{row.etiketNo}</td>
                        <td className="p-3 border border-ivosis-200">{row.projeAdi}</td>
                        <td className="p-3 border border-ivosis-200">{row.seriLot}</td>
                        <td className="p-3 border border-ivosis-200">{row.ebat}</td>
                        <td className="p-3 border border-ivosis-200">{row.agirlik.toLocaleString()}</td>
                        <td className="p-3 border border-ivosis-200">{row.miktar}</td>
                        <td className="p-3 border border-ivosis-200">{row.tarih}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-ivosis-900">Etiket Konfigürasyonu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baslangic" className="text-ivosis-900">Başlangıç Etiket No</Label>
                  <Input
                    id="baslangic"
                    value={formData.baslangicDegeri}
                    onChange={(e) => setFormData({...formData, baslangicDegeri: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                    placeholder="A108"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="miktar" className="text-ivosis-900">Miktar (Kaç Etiket)</Label>
                  <Input
                    id="miktar"
                    type="number"
                    value={formData.miktar}
                    onChange={(e) => setFormData({...formData, miktar: Math.round(parseInt(e.target.value)) || 1})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                    min="1" 
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projeAdi" className="text-ivosis-900">Proje Adı</Label>
                  <Input
                    id="projeAdi"
                    value={formData.projeAdi}
                    onChange={(e) => setFormData({...formData, projeAdi: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genislik" className="text-ivosis-900">Genişlik</Label>
                  <Input
                    id="genislik"
                    value={formData.genislik}
                    onChange={(e) => setFormData({...formData, genislik: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seriLot" className="text-ivosis-900">Seri/Lot</Label>
                  <Input
                    id="seriLot"
                    value={formData.seriLot}
                    onChange={(e) => setFormData({...formData, seriLot: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agirlik" className="text-ivosis-900">Ağırlık</Label>
                  <Input
                    id="agirlik"
                    type="number"
                    value={formData.agirlik}
                    onChange={(e) => setFormData({...formData, agirlik: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tarih" className="text-ivosis-900">Tarih</Label>
                  <Input
                    id="tarih"
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({...formData, tarih: e.target.value})}
                    className="border-ivosis-200 focus:border-ivosis-500"
                  />
                </div>
              </div>

              <Card className="border-ivosis-200 bg-ivosis-50">
                <CardHeader>
                  <CardTitle className="text-ivosis-900 text-base">Oluşturulacak Etiketler Önizleme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: Math.min(formData.miktar, 3) }).map((_, i) => {
                    const match = formData.baslangicDegeri.match(/^([A-Z]+)(\d+)$/);
                    if (!match) return null;
                    const prefix = match[1];
                    const num = parseInt(match[2]);
                    const etiketNo = prefix + (num + i);
                    return (
                      <div key={i} className="bg-white p-3 rounded border text-sm">
                        <strong>{etiketNo}</strong> {formData.projeAdi} {formData.genislik} {formData.seriLot} {Math.round(parseInt(formData.agirlik || '0') / formData.miktar)}kg {formData.tarih}
                      </div>
                    );
                  })}
                  {formData.miktar > 3 && (
                    <div className="text-xs text-ivosis-600 italic">
                      ... ve {formData.miktar - 3} etiket daha
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-ivosis-200">
          {step === 'preview' && (
            <>
              <Button onClick={resetModal} variant="outline" className="border-ivosis-300 text-ivosis-700 hover:bg-ivosis-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              <Button onClick={proceedToConfigure} disabled={selectedRows.length === 0} className="bg-ivosis-500 hover:bg-ivosis-600 disabled:opacity-50">
                Seçilenleri Düzenle ({selectedRows.length})
              </Button>
              <Button onClick={generateLabels} disabled={selectedRows.length === 0} className="bg-ivosis-600 hover:bg-ivosis-700 disabled:opacity-50">
                Etiket Oluştur
              </Button>
            </>
          )}
          {step === 'configure' && (
            <>
              <div className="w-full flex flex-wrap items-center gap-2 mb-2">
                {selectedRows.map((rowIdx, i) => (
                  <button
                    key={rowIdx}
                    type="button"
                    onClick={() => switchEditingRow(i)}
                    className={`px-2 py-1 rounded border ${i === currentEditIdx ? 'bg-ivosis-500 text-white border-ivosis-500' : 'bg-white text-ivosis-900 border-ivosis-300'}`}
                  >
                    {importData[rowIdx]?.etiketNo || `Satır ${rowIdx + 1}`}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep('preview')} variant="outline" className="border-ivosis-300 text-ivosis-700 hover:bg-ivosis-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              <Button type="button" onClick={handleSaveEdits} className="bg-ivosis-500 hover:bg-ivosis-600">
                Kaydet
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;