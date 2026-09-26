# Ağ Trafiği Ölçüm ve Simülasyon Aracı

Bant genişliği, gecikme (latency), jitter ve paket kaybı gibi temel ağ
parametrelerini canlı olarak değiştirip bir iletim kanalının nasıl
davrandığını gözlemlemek için geliştirilmiş etkileşimli bir simülasyon aracı.


## Ne işe yarar?

Bu araç gerçek bir ağı ölçmez — girilen parametrelere göre paketlerin
davranışını matematiksel bir modelle simüle eder. Amacı, aşağıdaki QoS
(Quality of Service) kavramlarını görsel olarak, deneyerek öğrenmektir:

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
