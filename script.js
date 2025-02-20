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
    const tcNoInput = document.getElementById('tcNo');
    const select = document.getElementById('ogretmenSelect');
    const errorMessage = document.getElementById('errorMessage');
    
    // Klavyeyi kapat
    select.blur();
    
    if (select.value !== "") {
        tcNoAlani.style.display = 'block';
        tcNoInput.disabled = false; // TC kimlik numarası girişini etkinleştir
        errorMessage.style.display = 'none';
    } else {
        tcNoAlani.style.display = 'none';
        tcNoInput.disabled = true; // TC kimlik numarası girişini pasif hale getir
    }
}

async function girisKontrol() {
    const select = document.getElementById('ogretmenSelect');
    const tcNo = document.getElementById('tcNo');
    const errorMessage = document.getElementById('errorMessage');

    // Klavyeyi kapat
    tcNo.blur();

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
            const ogretmenIsmi = `${data.ad.toUpperCase()} ${data.soyad.toUpperCase()} ÖĞRETMEN`;
            localStorage.setItem('ogretmenIsmi', ogretmenIsmi);
            document.getElementById('seciliOgretmen').textContent = ogretmenIsmi;
            document.getElementById('girisContainer').style.display = 'none';

            const ozelKullanicilar = [
                "19451103048", // Mehmet Kazan
                "31973140738", "21389038194", "60115197910", "26666641524" // Diğer özel kullanıcılar
            ];
            if (ozelKullanicilar.includes(tcNo.value)) {
                document.getElementById('ozelButonlarContainer').style.display = 'block';
                // Buton metnini değiştir
                document.querySelector('#ozelButonlarContainer button').innerHTML = `
                    <i class="fas fa-calendar-alt"></i>
                    TARİH SEÇİMİ
                `;
            } else {
                // Giriş başarılı olduğunda tarih seçimi ekranını göster
                document.getElementById('tarihContainer').style.display = 'block';
                setDefaultDate('tarihSec'); // Varsayılan tarihi ayarla
            }
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
        const tarihInput = document.getElementById('tarihSec');
        const tarih = new Date(tarihInput.value);
        
        // Gün ismini kontrol et
        const gun = tarih.toLocaleDateString('tr-TR', { weekday: 'long' }).toUpperCase();
        console.log(`Seçilen gün: ${gun}`); // Gün ismini kontrol etmek için log ekleyin

        const { data, error } = await supabaseClient
            .from('siniflar')
            .select('*')
            .eq('gun', gun)
            .order('ad', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('sinifSelect');
        select.innerHTML = '<option value="">Seçiniz</option>'; // Önceki seçenekleri temizle
        
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

function setDefaultDate(inputId) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById(inputId).value = today;
}

function tarihSec() {
    const tarihInput = document.getElementById('tarihSec');
    const tarih = tarihInput.value;
    
    if (tarih === "") {
        alert("Lütfen bir tarih seçiniz.");
        return;
    }

    document.getElementById('seciliTarih').textContent = tarih;
    document.getElementById('tarihContainer').style.display = 'none';
    document.getElementById('sinifContainer').style.display = 'block';
    getSiniflar(); // Tarih seçildikten sonra sınıfları yükle
}

function sinifSec() {
    const sinifSelect = document.getElementById('sinifSelect');
    const secilenSinif = sinifSelect.value;
    
    if (secilenSinif === "") {
        alert("Lütfen bir sınıf seçiniz.");
        return;
    }

    document.getElementById('seciliSinif').textContent = secilenSinif;
    document.getElementById('sinifContainer').style.display = 'none';
    document.getElementById('dersSaatiContainer').style.display = 'block';
}

let selectedDersSaatleri = new Set();

function dersSaatiSec(button) {
    const dersSaati = button.textContent;

    if (selectedDersSaatleri.has(dersSaati)) {
        selectedDersSaatleri.delete(dersSaati);
        button.classList.remove('selected');
    } else {
        selectedDersSaatleri.add(dersSaati);
        button.classList.add('selected');
    }

    document.getElementById('seciliDersSaati').textContent = Array.from(selectedDersSaatleri).join(', ');
}

async function yoklamaKaydet() {
    if (document.activeElement) {
        document.activeElement.blur();
    }

    try {
        const sinif = document.getElementById('seciliSinif').textContent;
        const ogretmen = document.getElementById('seciliOgretmen').textContent;
        const tarih = document.getElementById('seciliTarih').textContent;
        
        const gelmeyenOgrenciler = Array.from(document.querySelectorAll('.gelmedi'))
            .map(button => button.parentElement.textContent.split(' - ')[0].trim())
            .filter(no => no !== '')
            .join('-');

        const now = new Date();
        const turkishOffset = 3;
        const turkishTime = new Date(now.getTime() + (turkishOffset * 60 * 60 * 1000));
        const kayitTarihi = turkishTime.toISOString();

        for (let dersSaati of selectedDersSaatleri) {
        const { data, error } = await supabaseClient
            .from('yoklama')
            .select('*')
            .eq('sinif', sinif)
            .eq('ders_saati', dersSaati)
            .eq('tarih', tarih)
            .order('kayit_tarihi', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Yoklama sorgulama hatası:', error);
            throw error;
        }

        if (data && data.length > 0) {
                if (!confirm(`${dersSaati}. saat için zaten bir yoklama var. Güncellemek ister misiniz?`)) {
                    continue;
            }

            const { error: updateError } = await supabaseClient
                .from('yoklama')
                .update({ 
                    gelmeyen_ogrenciler: gelmeyenOgrenciler,
                    guncelleme_tarihi: kayitTarihi,
                    ogretmen: ogretmen
                })
                .eq('id', data[0].id);

            if (updateError) {
                console.error('Güncelleme hatası:', updateError);
                throw updateError;
            }

                alert(`${dersSaati}. saat için yoklama başarıyla güncellendi.`);
        } else {
            const { error: insertError } = await supabaseClient
                .from('yoklama')
                .insert([{ 
                    sinif, 
                    ders_saati: dersSaati, 
                    ogretmen, 
                    tarih,
                    gelmeyen_ogrenciler: gelmeyenOgrenciler,
                    kayit_tarihi: kayitTarihi
                }]);

            if (insertError) {
                console.error('Ekleme hatası:', insertError);
                throw insertError;
            }

                alert(`${dersSaati}. saat için yoklama başarıyla kaydedildi.`);
            }
        }

        // Başa dön
        selectedDersSaatleri.clear();
        document.getElementById('ogrenciListesiContainer').style.display = 'none';
        document.getElementById('girisContainer').style.display = 'block';

        // Seçimleri sıfırla
        secimleriSifirla();

    } catch (error) {
        console.error('Genel hata:', error);
        alert("Yoklama kaydedilirken bir hata oluştu: " + error.message);
    }
}

function geriDonGiris() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('girisContainer').style.display = 'block';
    secimleriSifirla();
}

function geriDonOzelGiris() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('ozelButonlarContainer').style.display = 'block';
}

function geriDonSinif() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('tarihContainer').style.display = 'block';
}

function geriDonOzelSinif() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('ozelButonlarContainer').style.display = 'block';
}

function geriDonTarih() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('sinifContainer').style.display = 'block';
}

function geriDonOzelTarih() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('ozelButonlarContainer').style.display = 'block';
}

function geriDonDersSaati() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('dersSaatiContainer').style.display = 'block';
}

function geriDonOzelDersSaati() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('ozelButonlarContainer').style.display = 'block';
}

function geriDonRaporTarih() {
    tumEkranlariGizle();
    document.getElementById('raporTarihContainer').style.display = 'block';
}

async function yoklamaAl() {
    const secilenSinif = document.getElementById('seciliSinif').textContent;
    const tarih = document.getElementById('seciliTarih').textContent;
    const dersSaatleri = Array.from(selectedDersSaatleri);

    if (dersSaatleri.length === 0) {
        alert("Lütfen en az bir ders saati seçiniz.");
        return;
    }

    try {
        const { data: ogrenciler, error: ogrenciError } = await supabaseClient
            .from('ogrencilistesi')
            .select('*')
            .eq('sinif_adi', secilenSinif)
            .order('ogrenci_no', { ascending: true });

        if (ogrenciError) throw ogrenciError;

        // Son yoklama durumunu al
        const { data: yoklamaData, error: yoklamaError } = await supabaseClient
            .from('yoklama')
            .select('*')
            .eq('sinif', secilenSinif)
            .in('ders_saati', dersSaatleri)
            .eq('tarih', tarih)
            .order('kayit_tarihi', { ascending: false });

        if (yoklamaError) throw yoklamaError;

        let gelmeyenOgrenciler = new Set();
        if (yoklamaData.length === dersSaatleri.length) {
            yoklamaData.forEach(yoklama => {
                if (yoklama.gelmeyen_ogrenciler) {
                    yoklama.gelmeyen_ogrenciler.split('-').forEach(no => gelmeyenOgrenciler.add(no.trim()));
                }
            });
        }

        const ogrenciListesi = document.getElementById('ogrenciListesi');
        ogrenciListesi.innerHTML = '<ul>' + ogrenciler.map(ogrenci => {
            const isGelmedi = gelmeyenOgrenciler.has(ogrenci.ogrenci_no);
            return `
                <li>
                    <span style="flex: 1;">${ogrenci.ogrenci_no} - ${ogrenci.ogrenci_ad_soyad}</span>
                    <button class="durum-button ${isGelmedi ? 'gelmedi' : 'geldi'}" onclick="toggleDurum(this)">
                        ${isGelmedi ? 'GELMEDİ' : 'GELDİ'}
                    </button>
                </li>
            `;
        }).join('') + '</ul>';

        document.getElementById('dersSaatiContainer').style.display = 'none';
        document.getElementById('ogrenciListesiContainer').style.display = 'block';

    } catch (error) {
        console.error('Hata:', error);
        alert('Öğrenci listesi yüklenirken bir hata oluştu.');
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

function sinifSecimi() {
    // Özel kullanıcılar için özel akış
    const tcNo = document.getElementById('tcNo').value;
    const ozelKullanicilar = [
        "19451103048", // Mehmet Kazan
        "31973140738", "21389038194", "60115197910", "26666641524" // Diğer özel kullanıcılar
    ];
    if (ozelKullanicilar.includes(tcNo)) {
        document.getElementById('ozelButonlarContainer').style.display = 'none';
        document.getElementById('tarihContainer').style.display = 'block';
        setDefaultDate('tarihSec'); // Varsayılan tarihi ayarla
    } else {
        // Diğer kullanıcılar için normal akış
        document.getElementById('ozelButonlarContainer').style.display = 'none';
        document.getElementById('tarihContainer').style.display = 'block';
        setDefaultDate('tarihSec');
    }
}

function yoklamaRaporu() {
    document.getElementById('ozelButonlarContainer').style.display = 'none';
    document.getElementById('raporTarihContainer').style.display = 'block';
    getSiniflarForRapor();
}

async function getSiniflarForRapor() {
    try {
        const tarihInput = document.getElementById('tarihAraligiSec');
        const tarihAraligi = tarihInput.value.split(' - ');
        const baslangicTarih = new Date(tarihAraligi[0]);
        const bitisTarih = tarihAraligi[1] ? new Date(tarihAraligi[1]) : baslangicTarih;
        
        const gunler = new Set();
        for (let d = new Date(baslangicTarih); d <= bitisTarih; d.setDate(d.getDate() + 1)) {
            const gun = d.toLocaleDateString('tr-TR', { weekday: 'long' }).toUpperCase();
            gunler.add(gun);
        }

        const { data, error } = await supabaseClient
            .from('siniflar')
            .select('*')
            .in('gun', Array.from(gunler))
            .order('ad', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('raporSinifSelect');
        select.innerHTML = '<option value="">Seçiniz</option>'; // Önceki seçenekleri temizle
        select.innerHTML += '<option value="TÜM SINIFLAR">TÜM SINIFLAR</option>'; // "TÜM SINIFLAR" seçeneği ekle
        
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

async function raporTarihSec() {
    const tarihAraligi = $('#tarihAraligiSec').val().split(' - ');
    const baslangicTarih = tarihAraligi[0];
    const bitisTarih = tarihAraligi[1];

    if (!baslangicTarih || !bitisTarih) {
        alert("Lütfen bir tarih aralığı seçiniz.");
        return;
    }

    // Devamsızlık kayıtlarını al
    getDevamsizlikRaporu(baslangicTarih, bitisTarih);
}

async function getDevamsizlikRaporu(baslangicTarih, bitisTarih) {
    try {
        const { data, error } = await supabaseClient
            .from('yoklama')
            .select('*')
            .gte('tarih', baslangicTarih)
            .lte('tarih', bitisTarih)
            .order('tarih', { ascending: true })
            .order('ders_saati', { ascending: true });

        if (error) throw error;

        const raporListesi = document.getElementById('raporListesi');
        raporListesi.innerHTML = ''; // Önceki raporları temizle

        if (data.length === 0) {
            raporListesi.innerHTML = '<p>Seçilen tarih aralığı için devamsızlık kaydı bulunamadı.</p>';
            return;
        }

        // Tablo başlıkları
        raporListesi.innerHTML = `
            <table class="excel-style">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Sınıf</th>
                        <th>Ders Saati</th>
                        <th>Öğretmen</th>
                        <th>Gelmeyen Öğrenciler</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(yoklama => {
                        const gelmeyenOgrenciler = yoklama.gelmeyen_ogrenciler ? yoklama.gelmeyen_ogrenciler.split('-').join(', ') : 'Yok';
                        return `
                            <tr>
                                <td>${yoklama.tarih}</td>
                                <td>${yoklama.sinif}</td>
                                <td>${yoklama.ders_saati}</td>
                                <td>${yoklama.ogretmen}</td>
                                <td>${gelmeyenOgrenciler}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('raporTarihContainer').style.display = 'none';
        document.getElementById('raporSonucContainer').style.display = 'block';

    } catch (error) {
        console.error('Hata:', error);
        alert('Devamsızlık raporu yüklenirken bir hata oluştu.');
    }
}

function indirCSV() {
    const raporListesi = document.querySelectorAll('#raporListesi table tbody tr');
    let csvContent = "data:text/csv;charset=utf-8,Sınıf,Ders Saati,Öğretmen,Gelmeyen Öğrenciler\n";

    raporListesi.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent).join(',');
        csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = 'devamsizlik_raporu.txt';
    a.click();
}

function secimleriSifirla() {
    // Seçim bilgilerini temizle
    document.getElementById('seciliOgretmen').textContent = '';
    document.getElementById('seciliSinif').textContent = '';
    document.getElementById('seciliTarih').textContent = '';
    document.getElementById('seciliDersSaati').textContent = '';

    // Seçim alanlarını sıfırla
    document.getElementById('ogretmenSelect').selectedIndex = 0;
    document.getElementById('tcNo').value = '';
    document.getElementById('sinifSelect').selectedIndex = 0;
    document.getElementById('tarihSec').value = '';
    selectedDersSaatleri.clear();
}

function tumEkranlariGizle() {
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
        container.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    getOgretmenler();

    // Tarih değiştiğinde sınıf listesini güncelle
    const tarihInput = document.getElementById('tarihSec');
    tarihInput.addEventListener('change', function() {
        getSiniflar();
    });

    const raporTarihInput = document.getElementById('raporTarihSec');
    raporTarihInput.addEventListener('change', function() {
        getSiniflarForRapor();
    });
});

// Tüm input ve select elementleri için otomatik klavye kapatma
document.addEventListener('change', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        e.target.blur();
    }
});

function geriDonOzelButonlar() {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    tumEkranlariGizle();
    document.getElementById('ozelButonlarContainer').style.display = 'block';
}

$(function() {
    $('#tarihAraligiSec').daterangepicker({
        locale: {
            format: 'YYYY-MM-DD'
        },
        singleDatePicker: false,
        showDropdowns: true,
        minYear: 1901,
        maxYear: parseInt(moment().format('YYYY'),10),
        opens: 'center',
        autoApply: true,
        linkedCalendars: false,
        showCustomRangeLabel: false
    });
});
