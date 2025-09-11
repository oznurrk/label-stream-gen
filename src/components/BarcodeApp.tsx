import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, Download, Search, Plus, Edit3, Trash2, Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { LabelFormModal } from './LabelFormModal';
import { ExcelImportModal } from './ExcelImportModal';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

export interface Label {
  id: number;
  etiketNo: string;
  malzeme: string;
  ebat: string;
  seriLot: string;
  agirlik: number;
  tarih: string;
}

export const BarcodeApp = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<Label[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLabelFormModalOpen, setIsLabelFormModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLabels([]);
    setFilteredLabels([]);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLabels(labels);
    } else {
      const filtered = labels.filter(label =>
        label.etiketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        label.malzeme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        label.seriLot.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLabels(filtered);
    }
  }, [searchTerm, labels]);

  const handleImportFromModal = (importedLabels: Omit<Label, 'id'>[]) => {
    const newLabels = importedLabels.map((label, index) => ({
      id: Math.max(...labels.map(l => l.id), 0) + index + 1,
      ...label
    }));
    setLabels(prev => [...prev, ...newLabels]);
    toast({
      title: "Başarılı",
      description: `${importedLabels.length} etiket başarıyla eklendi`,
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredLabels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLabels.map(label => label.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteLabel = (id: number) => {
    setLabels(prev => prev.filter(label => label.id !== id));
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    toast({
      title: "Etiket Silindi",
      description: "Etiket başarıyla silindi",
    });
  };

  const handleEditLabel = (id: number) => {
    const label = labels.find(l => l.id === id);
    if (label) {
      setEditingLabel(label);
      setIsLabelFormModalOpen(true);
    }
  };

  const handleSaveLabel = (labelData: Omit<Label, 'id'>) => {
    if (editingLabel) {
      setLabels(prev => prev.map(l => 
        l.id === editingLabel.id ? { ...l, ...labelData } : l
      ));
      toast({
        title: "Etiket Güncellendi",
        description: "Etiket başarıyla güncellendi",
      });
      setEditingLabel(null);
    } else {
      const newLabel: Label = {
        id: Math.max(...labels.map(l => l.id), 0) + 1,
        ...labelData
      };
      setLabels(prev => [...prev, newLabel]);
      toast({
        title: "Yeni Etiket Eklendi",
        description: "Etiket başarıyla eklendi",
      });
    }
  };

  const addNewLabel = () => {
    setEditingLabel(null);
    setIsLabelFormModalOpen(true);
  };

  const handleCloseLabelModal = () => {
    setIsLabelFormModalOpen(false);
    setEditingLabel(null);
  };

  const generateSimpleBarcode = (text: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = 150;
    canvas.height = 40;
    ctx.fillStyle = '#000';
    let x = 0;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const width = (charCode % 4) + 1;
      if (i % 2 === 0) {
        ctx.fillRect(x, 0, width, 30);
      }
      x += width + 1;
    }
    return canvas.toDataURL();
  };

  const printLabels = () => {
    const selectedLabels = filteredLabels.filter(label => selectedIds.includes(label.id));
    if (selectedLabels.length === 0) {
      toast({
        title: "Hata",
        description: "Yazdırılacak etiket seçilmedi",
        variant: "destructive",
      });
      return;
    }
    
      // 100x70mm etiket tasarımı
    const printContent = selectedLabels.map(label => `
      <div style="
        width: 100mm; 
        height: 70mm; 
        padding: 2mm;         
        page-break-inside: avoid;   /* yazdırırken bölünmesin */
        page-break-after: always;  /* yeni sayfada başlasın */
        font-family: 'Arial', sans-serif;
        background: white;  
        
      ">
        <!-- Etiket No -->
        <div style="text-align: center; margin-bottom: 3mm;">
          <div style="font-size: 24pt; font-weight: bold; color: #000;">
            ${label.etiketNo}
          </div>
        </div>

        <!-- Bilgiler -->
        <div style="flex: 1; display: flex; flex-direction: column; text-align: center; justify-content: space-around;">
          <div style="font-size: 18pt; font-weight: bold; color: #000; "> ${label.malzeme}</div>
          <div style="font-size: 18pt; font-weight: bold; color: #000; ">${label.ebat.replace('x', 'X').replace('X', ' X ')}</div>
          <div style="font-size: 18pt; font-weight: bold; color: #000; ">${label.seriLot}</div>
          <div style="font-size: 18pt; font-weight: bold; color: #000; ">${new Date(label.tarih).toLocaleDateString('tr-TR')}</div>
          <div style="font-size: 18pt; font-weight: bold; color: #000; ">${label.agirlik.toLocaleString()} KG</div>
        </div>
      </div>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        ${printContent}
        <script>
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivosis-50 to-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-ivosis-950 to-ivosis-800 text-white rounded-xl p-6 lg:p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-2">
                Excel Tabanlı Etiket Yönetimi
              </h1>
              <p className="text-ivosis-100 text-sm lg:text-base">
                DİLME PLANLARI sheet'inden otomatik etiket oluşturma sistemi
              </p>
            </div>
            
            <div className="hidden lg:block">
              <img src="./ivosisCelik2.png" alt="Ivosis Çelik Logo" className="h-16 w-auto" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="border-ivosis-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Etiket No, Malzeme veya Seri/Lot ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-ivosis-200 focus:border-ivosis-500"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={addNewLabel} className="bg-ivosis-500 hover:bg-ivosis-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Etiket
                </Button>
                
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  className="border-ivosis-500 text-ivosis-700 hover:bg-ivosis-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel İçe Aktar
                </Button>
                
                <Button
                  onClick={printLabels}
                  disabled={selectedIds.length === 0}
                  variant="outline"
                  className="border-ivosis-500 text-ivosis-700 hover:bg-ivosis-50 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır ({selectedIds.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-ivosis-200 bg-gradient-to-br from-card to-ivosis-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-ivosis-600 mb-2">
                  {filteredLabels.length}
                </div>
                <div className="text-sm text-muted-foreground">Toplam Etiket</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-ivosis-200 bg-gradient-to-br from-card to-ivosis-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-ivosis-600 mb-2">
                  {selectedIds.length}
                </div>
                <div className="text-sm text-muted-foreground">Seçili Etiket</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-ivosis-200 bg-gradient-to-br from-card to-ivosis-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-ivosis-600 mb-2">
                  {filteredLabels.reduce((sum, label) => sum + label.agirlik, 0).toLocaleString()} KG
                </div>
                <div className="text-sm text-muted-foreground">Toplam Ağırlık</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-ivosis-200 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ivosis-50 border-b border-ivosis-200">
                  <tr>
                    <th className="p-4 text-left">
                      <Checkbox 
                        checked={selectedIds.length === filteredLabels.length && filteredLabels.length > 0} 
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Etiket No</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Malzeme</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Ebat</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Seri/Lot</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Ağırlık (KG)</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Tarih</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">Barkod</th>
                    <th className="p-4 text-left font-semibold text-ivosis-900">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabels.map((label) => (
                    <tr 
                      key={label.id} 
                      className={`border-b border-ivosis-100 hover:bg-ivosis-50 transition-colors ${
                        selectedIds.includes(label.id) ? 'bg-ivosis-100' : ''
                      }`}
                    >
                      <td className="p-4">
                        <Checkbox 
                          checked={selectedIds.includes(label.id)} 
                          onCheckedChange={() => handleSelectItem(label.id)}
                        />
                      </td>
                      <td className="p-4 font-semibold text-ivosis-900">{label.etiketNo}</td>
                      <td className="p-4">{label.malzeme}</td>
                      <td className="p-4">{label.ebat}</td>
                      <td className="p-4">{label.seriLot}</td>
                      <td className="p-4">{label.agirlik.toLocaleString()}</td>
                      <td className="p-4">{new Date(label.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="p-4">
                        <img src={generateSimpleBarcode(label.etiketNo)} alt="barkod" className="h-6 w-20" />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditLabel(label.id)}
                            size="sm"
                            variant="outline"
                            className="border-ivosis-300 text-ivosis-600 hover:bg-ivosis-50"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteLabel(label.id)}
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLabels.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Etiket bulunamadı. Excel dosyası yükleyerek etiket ekleyin.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <ExcelImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportFromModal}
        />

        <LabelFormModal 
          isOpen={isLabelFormModalOpen}
          onClose={handleCloseLabelModal}
          onSave={handleSaveLabel}
          editingLabel={editingLabel}
        />

        <Toaster />
      </div>
    </div>
  );
};

export default BarcodeApp;