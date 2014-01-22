# Bedah FlightJS

Repositori ini bertujuan untuk memberi komentar terhadap tiap API yang disediakan oleh FlightJS. Tetapi saya tidaklah mengaku sebagai ahli FlightJS. Ini adalah komentar saya pribadi terhadap kode FlightJS.

Sehingga, saya sangatlah terbuka bila Anda mau meluruskan komentar saya yang keliru bila Anda menemukannya. Ataupun bila ada komentar yang kurang jelas, saya berharap Anda mau memberitahukannya.

# Tentang FlightJS

FlightJS adalah sebuah framework kecil yang unik. Pendekatannya unik. Paradigma berfikirinya unik.

Setiap komponen hanya dapat berkomunikasi dengan komponen lain melalui `event`. Pendekatan ini diambil untuk meminimalisir ketergantungan dengan komponen lain. Sehingga, sistem menjadi modular, karena komponen hanya perlu tahu tentang `event`.

FlightJS menggunakan `mixin` untuk berbagi kode. Pendekatan mixinnya juga sangatlah sederhana.  Penjelasan singkat mengenai mekanisme kerja `mixin` yang digunakan oleh FlightJS dapat Anda lihat disini: [Menerapkan Mixin Ala FlightJS](keripix.pethak.com/bedah-pustaka-menerapkan-mixin-ala-flightjs/).

FlightJS sangat menghandalkan DOM. DOM Event API dimanfaatkannya sebagai saluran komunikasi event. DOM juga dijadikan syarat untuk menginisiasi komponen.
