// Parâmetros estáticos da Central de Métricas.
export const PERIODOS_RAPIDOS=[
 {id:'hoje',rotulo:'HOJE',dias:0},
 {id:'7',rotulo:'7 DIAS',dias:6},
 {id:'14',rotulo:'14 DIAS',dias:13},
 {id:'30',rotulo:'30 DIAS',dias:29},
 {id:'mes',rotulo:'ESTE MÊS',mes:0},
 {id:'mesant',rotulo:'MÊS PASSADO',mes:-1}
];

export const TRIAGEM_CARENCIA_DIAS=14;

export const TRIAGEM_LIMITES={
 limparDias:2,        // presenca de ate 2 dias em 7
 limparMedia:1,       // ou media diaria abaixo de 1
 acompanharDias:5,    // presenca de 3 a 5 dias
 quedaGrave:40,       // ou queda acima de 40% contra a semana anterior
 bemDias:6,           // presenca de 6 ou 7 dias
 bemMedia:6           // e media acima de 6 por dia
};
