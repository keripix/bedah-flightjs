// FlightJS adalah framework javascript yang memiliki konsep yang agak berbeda
// dengan beberapa Framework javascript lainnya. Beberapa pendekatan utamanya
// adalah:
// 
// 1. Menitik beratkan komponen yang terhubung erat dengan DOM.
//    
//    Konsekuensi dari orientasi terhadap DOM ini adalah:
//    
//    1. Menjadikan DOM Event API sebagai jalur komunikasi event antar
//    komponen.
//    2. Tiap komponen harus diinisiasi terhadap sebuah element di DOM.
//    
// 2. Berbagi kode memanfaatkan mixin.
// 3. Menyediakan API untuk Aspect Oriented Programming agar komponen bisa
// lebih fleksibel.
define(

  [
    './advice',
    './component',
    './compose',
    './logger',
    './registry',
    './utils'
  ],

  function(advice, component, compose, logger, registry, utils) {
    'use strict';

    // Mempublikasikan API internal terhadap konsumen
    return {
      // `advice`: Menyediakan API untuk Aspect Oriented Programming
      advice: advice,
      // `component`: Menyediakan API untuk mendefinisikan komponen
      component: component,
      // `compose`: Menyediakan API untuk menerapkan mixin
      compose: compose,
      // `logger`: Menyediakan API untuk logging
      logger: logger,
      // `registry`: Menyediakan API untuk registerasi komponen
      registry: registry,
      // `utils`: Menyediakan API untuk membantu komponen
      utils: utils
    };

  }
);
