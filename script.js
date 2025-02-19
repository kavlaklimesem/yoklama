async function getOgretmenler() {
    try {
        console.log("Öğretmenler getiriliyor...");
        const { data, error } = await supabaseClient
            .from('ogretmenler')
            .select('*')
            .order('ad', { ascending: true });

        if (error) {
            console.error('Supabase Hatası:', error);
            throw error;
        }

        console.log("Gelen veri:", data);

        const select = document.getElementById('ogretmenSelect');
        
        if (data && data.length > 0) {
            data.forEach(ogretmen => {
                const option = document.createElement('option');
                option.value = ogretmen.id;
                option.textContent = `${ogretmen.ad} ${ogretmen.soyad} - ${ogretmen.brans}`;
                select.appendChild(option);
            });
        } else {
            console.log("Veri bulunamadı");
        }

    } catch (error) {
        console.error('Genel Hata:', error);
    }
}

function ogretmenSecildi() {
    const tcNoAlani = document.getElementById('tcNoAlani');
    const select = document.getElementById('ogretmenSelect');
    const errorMessage = document.getElementById('errorMessage');
    
    if (select.value !== "") {
        tcNoAlani.style.display = 'block';
        errorMessage.style.display = 'none';
    } else {
        tcNoAlani.style.display = 'none';
    }
}

async function girisKontrol() {
    const select = document.getElementById('ogretmenSelect');
    const tcNo = document.getElementById('tcNo');
    const errorMessage = document.getElementById('errorMessage');

    if (select.value === "") {
        errorMessage.style.display = 'block';
        return;
    }

    if (tcNo.value.length !== 11) {
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('ogretmenler')
            .select('*')
            .eq('id', select.value)
            .eq('tc_no', tcNo.value)
            .single();

        if (error) throw error;

        if (data) {
            localStorage.setItem('ogretmenIsmi', `${data.ad.toUpperCase()} ${data.soyad.toUpperCase()} ÖĞRETMEN`);
            document.getElementById('seciliOgretmen').textContent = localStorage.getItem('ogretmenIsmi');
            document.getElementById('girisContainer').style.display = 'none';
            document.getElementById('sinifContainer').style.display = 'block';
            getSiniflar();
        } else {
            errorMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Hata:', error);
        errorMessage.style.display = 'block';
    }
}

async function getSiniflar() {
    try {
        const { data, error } = await supabaseClient
            .from('siniflar')
            .select('*')
            .order('ad', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('sinifSelect');
        
        data.forEach(sinif => {
            const option = document.createElement('option');
            option.value = sinif.ad;
            option.textContent = sinif.ad;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Hata:', error);
    }
}

function sinifSec() {
    const sinifSelect = document.getElementById('sinifSelect');
    if (sinifSelect.value === "") {
        return;
    }
    const secilenSinif = sinifSelect.options[sinifSelect.selectedIndex].text;
    document.getElementById('seciliSinif').textContent = secilenSinif;
    document.getElementById('sinifContainer').style.display = 'none';
    document.getElementById('tarihContainer').style.display = 'block';
    setDefaultDate();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tarihSec').value = today;
}

function tarihSec() {
    const tarih = document.getElementById('tarihSec').value;
    document.getElementById('seciliTarih').textContent = tarih;
    document.getElementById('tarihContainer').style.display = 'none';
    document.getElementById('dersSaatiContainer').style.display = 'block';
}

async function dersSaatiSec(button) {
    const buttons = document.querySelectorAll('.ders-saatleri button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');

    const dersSaati = button.textContent;
    document.getElementById('seciliDersSaati').textContent = dersSaati;

    const secilenSinif = document.getElementById('sinifSelect').value;
    try {
        const { data, error } = await supabaseClient
            .from('ogrencilistesi')
            .select('*')
            .eq('sinif_adi', secilenSinif);

        if (error) throw error;

        const ogrenciListesi = document.getElementById('ogrenciListesi');
        ogrenciListesi.innerHTML = '<ul>' + data.map(ogrenci => `
            <li>
                <span style="flex: 1;">${ogrenci.ogrenci_no} - ${ogrenci.ogrenci_ad_soyad}</span>
                <button class="durum-button geldi" onclick="toggleDurum(this)">GELDİ</button>
            </li>
        `).join('') + '</ul>';

        document.getElementById('dersSaatiContainer').style.display = 'none';
        document.getElementById('ogrenciListesiContainer').style.display = 'block';

    } catch (error) {
        console.error('Hata:', error);
    }
}

function toggleDurum(button) {
    if (button.classList.contains('geldi')) {
        button.classList.remove('geldi');
        button.classList.add('gelmedi');
        button.textContent = 'GELMEDİ';
    } else {
        button.classList.remove('gelmedi');
        button.classList.add('geldi');
        button.textContent = 'GELDİ';
    }
}

async function yoklamaKaydet() {
    try {
        const sinif = document.getElementById('seciliSinif').textContent;
        const dersSaati = document.getElementById('seciliDersSaati').textContent;
        const ogretmen = document.getElementById('seciliOgretmen').textContent;
        const tarih = document.getElementById('seciliTarih').textContent;
        
        const gelmeyenOgrenciler = Array.from(document.querySelectorAll('.gelmedi'))
            .map(button => button.parentElement.textContent.split(' - ')[0].trim())
            .join('-');

        console.log('Kaydedilecek veriler:', {
            sinif,
            dersSaati,
            ogretmen,
            tarih,
            gelmeyenOgrenciler
        });

        const { data, error } = await supabaseClient
            .from('yoklama')
            .select('*')
            .eq('sinif', sinif)
            .eq('ders_saati', dersSaati)
            .eq('ogretmen', ogretmen)
            .eq('tarih', tarih);

        if (error) {
            console.error('Yoklama sorgulama hatası:', error);
            throw error;
        }

        if (data && data.length > 0) {
            if (!confirm("Bu gün ve ders saati için zaten bir yoklama var. Güncellemek ister misiniz?")) {
                return;
            }

            const { error: updateError } = await supabaseClient
                .from('yoklama')
                .update({ 
                    gelmeyen_ogrenciler: gelmeyenOgrenciler,
                    guncelleme_tarihi: new Date().toISOString()
                })
                .eq('id', data[0].id);

            if (updateError) {
                console.error('Güncelleme hatası:', updateError);
                throw updateError;
            }

            alert("Yoklama başarıyla güncellendi.");
        } else {
            const { error: insertError } = await supabaseClient
                .from('yoklama')
                .insert([{ 
                    sinif, 
                    ders_saati: dersSaati, 
                    ogretmen, 
                    tarih,
                    gelmeyen_ogrenciler: gelmeyenOgrenciler,
                    kayit_tarihi: new Date().toISOString()
                }]);

            if (insertError) {
                console.error('Ekleme hatası:', insertError);
                throw insertError;
            }

            alert("Yoklama başarıyla kaydedildi.");
        }
    } catch (error) {
        console.error('Genel hata:', error);
        alert("Yoklama kaydedilirken bir hata oluştu: " + error.message);
    }
}

function geriDonGiris() {
    document.getElementById('sinifContainer').style.display = 'none';
    document.getElementById('girisContainer').style.display = 'block';
}

function geriDonSinif() {
    document.getElementById('tarihContainer').style.display = 'none';
    document.getElementById('sinifContainer').style.display = 'block';
}

function geriDonTarih() {
    document.getElementById('dersSaatiContainer').style.display = 'none';
    document.getElementById('tarihContainer').style.display = 'block';
}

function geriDonDersSaati() {
    document.getElementById('ogrenciListesiContainer').style.display = 'none';
    document.getElementById('dersSaatiContainer').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', getOgretmenler);
