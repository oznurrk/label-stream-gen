import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import type { Label as LabelType } from './BarcodeApp';

interface LabelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (labelData: Omit<LabelType, 'id'>) => void;
  editingLabel?: LabelType | null;
}

export const LabelFormModal: React.FC<LabelFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingLabel = null 
}) => {
  const [formData, setFormData] = useState({
    etiketNo: '',
    malzeme: 'TARIMSAL',
    ebat: '3X171',
    seriLot: '25/627',
    agirlik: '',
    tarih: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingLabel) {
      setFormData({
        etiketNo: editingLabel.etiketNo,
        malzeme: editingLabel.malzeme,
        ebat: editingLabel.ebat,
        seriLot: editingLabel.seriLot,
        agirlik: editingLabel.agirlik.toString(),
        tarih: editingLabel.tarih
      });
    } else {
      setFormData({
        etiketNo: '',
        malzeme: 'TARIMSAL',
        ebat: '3X171',
        seriLot: '25/627',
        agirlik: '',
        tarih: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [editingLabel, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.etiketNo.trim()) {
      newErrors.etiketNo = 'Etiket numarası gerekli';
    } else if (!/^[A-Z]+\d+$/.test(formData.etiketNo.trim())) {
      newErrors.etiketNo = 'Format: A108 (Harf + Sayı)';
    }
    
    if (!formData.malzeme.trim()) {
      newErrors.malzeme = 'Proje adı gerekli';
    }
    
    if (!formData.ebat.trim()) {
      newErrors.ebat = 'Ebat bilgisi gerekli';
    }
    
    if (!formData.seriLot.trim()) {
      newErrors.seriLot = 'Seri/Lot bilgisi gerekli';
    }
    
    if (!formData.agirlik || parseInt(formData.agirlik) <= 0) {
      newErrors.agirlik = 'Geçerli bir ağırlık girin';
    }
    
    if (!formData.tarih) {
      newErrors.tarih = 'Tarih seçin';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        agirlik: parseInt(formData.agirlik),
        etiketNo: formData.etiketNo.trim().toUpperCase()
      });
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-ivosis-200">
        <DialogHeader>
          <DialogTitle className="text-ivosis-900">
            {editingLabel ? 'Etiket Düzenle' : 'Yeni Etiket Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Etiket No */}
            <div className="space-y-2">
              <Label htmlFor="etiketNo" className="text-ivosis-900">
                Etiket Numarası *
              </Label>
              <Input
                id="etiketNo"
                value={formData.etiketNo}
                onChange={(e) => handleInputChange('etiketNo', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.etiketNo ? 'border-destructive' : ''
                }`}
                placeholder="A108"
              />
              {errors.etiketNo && (
                <p className="text-sm text-destructive">{errors.etiketNo}</p>
              )}
            </div>

            {/* Proje Adı */}
            <div className="space-y-2">
              <Label htmlFor="malzeme" className="text-ivosis-900">
                Proje Adı *
              </Label>
              <Input
                id="malzeme"
                value={formData.malzeme}
                onChange={(e) => handleInputChange('malzeme', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.malzeme ? 'border-destructive' : ''
                }`}
                placeholder="Proje Adı"
              />
              {errors.malzeme && (
                <p className="text-sm text-destructive">{errors.malzeme}</p>
              )}
            </div>

            {/* Ebat */}
            <div className="space-y-2">
              <Label htmlFor="ebat" className="text-ivosis-900">
                Ebat *
              </Label>
              <Input
                id="ebat"
                value={formData.ebat}
                onChange={(e) => handleInputChange('ebat', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.ebat ? 'border-destructive' : ''
                }`}
                placeholder="3X171"
              />
              {errors.ebat && (
                <p className="text-sm text-destructive">{errors.ebat}</p>
              )}
            </div>

            {/* Seri/Lot */}
            <div className="space-y-2">
              <Label htmlFor="seriLot" className="text-ivosis-900">
                Seri/Lot *
              </Label>
              <Input
                id="seriLot"
                value={formData.seriLot}
                onChange={(e) => handleInputChange('seriLot', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.seriLot ? 'border-destructive' : ''
                }`}
                placeholder="25/627"
              />
              {errors.seriLot && (
                <p className="text-sm text-destructive">{errors.seriLot}</p>
              )}
            </div>

            {/* Ağırlık */}
            <div className="space-y-2">
              <Label htmlFor="agirlik" className="text-ivosis-900">
                Ağırlık (KG) *
              </Label>
              <Input
                id="agirlik"
                type="number"
                value={formData.agirlik}
                onChange={(e) => handleInputChange('agirlik', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.agirlik ? 'border-destructive' : ''
                }`}
                placeholder="858"
                min="1"
              />
              {errors.agirlik && (
                <p className="text-sm text-destructive">{errors.agirlik}</p>
              )}
            </div>

            {/* Tarih */}
            <div className="space-y-2">
              <Label htmlFor="tarih" className="text-ivosis-900">
                Tarih *
              </Label>
              <Input
                id="tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => handleInputChange('tarih', e.target.value)}
                className={`border-ivosis-200 focus:border-ivosis-500 ${
                  errors.tarih ? 'border-destructive' : ''
                }`}
              />
              {errors.tarih && (
                <p className="text-sm text-destructive">{errors.tarih}</p>
              )}
            </div>
          </div>

          {/* Form Butonları */}
          <div className="flex gap-3 justify-end pt-4 border-t border-ivosis-200">
            <Button 
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-ivosis-300 text-ivosis-700 hover:bg-ivosis-50"
            >
              İptal
            </Button>
            <Button 
              type="submit"
              className="bg-ivosis-500 hover:bg-ivosis-600"
            >
              {editingLabel ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LabelFormModal;