# Ağ Trafiği Ölçüm ve Simülasyon Aracı

Bant genişliği, gecikme (latency), jitter ve paket kaybı gibi temel ağ
parametrelerini canlı olarak değiştirip bir iletim kanalının nasıl
davrandığını gözlemlemek için geliştirilmiş etkileşimli bir simülasyon aracı.

**Canlı demo:** _(GitHub Pages veya barındırma linki buraya eklenecek)_

## Ne işe yarar?

Bu araç gerçek bir ağı ölçmez — girilen parametrelere göre paketlerin
davranışını matematiksel bir modelle simüle eder. Amacı, aşağıdaki QoS
(Quality of Service) kavramlarını görsel olarak, deneyerek öğrenmektir:

- **Bant genişliği (bandwidth):** Kanalın taşıma kapasitesi (Mbps)
- **Gecikme (latency):** Bir paketin göndericiden alıcıya ulaşma süresi (ms)
- **Jitter:** Paketler arası gecikmenin düzensizliği
- **Paket kaybı (packet loss):** Paketlerin yolda kaybolma olasılığı (%)
- **Verim (throughput):** Aynı anda gerçekten taşınan veri miktarı

## Hazır senaryolar

Fiber (FTTH), 4G LTE, 3G, uydu bağlantısı, sıkışık Wi-Fi ve zayıf sinyal gibi
gerçekçi ağ koşullarını tek tıkla simüle edebilirsin.

## Kullanılan teknolojiler

- Saf HTML / CSS / JavaScript (framework yok)
- Canvas API ile gerçek zamanlı paket akışı ve verim grafiği çizimi

## Nasıl çalıştırılır?

Depoyu klonla ve `network-simulator.html` dosyasını bir tarayıcıda aç:

```bash
git clone https://github.com/KULLANICI_ADIN/ag-trafigi-simulatoru.git
cd ag-trafigi-simulatoru
open network-simulator.html   # macOS
# veya dosyaya çift tıkla
```

## Yol haritası

- [x] Temel simülasyon motoru ve arayüz
- [x] Mühendislik dokümanı / datasheet tarzı görsel tasarım
- [ ] Gerçek ping/iperf3 verisiyle kalibrasyon modu
- [ ] Kuyruk (queue) tabanlı gerçekçi tıkanıklık modeli
- [ ] Kodun modüllere ayrılması
- [ ] GitHub Pages üzerinden canlı yayın

## Neden bu proje?

İstanbul'daki telekom şirketlerinde (Turkcell, Vodafone, Türk Telekom vb.)
staj başvurusu için temel ağ kavramlarını (bant genişliği, gecikme, jitter,
paket kaybı, QoS) somut ve görsel şekilde göstermek amacıyla geliştirilmiştir.
