export function chatTime(v){const d=v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?.createdAtText?new Date(v.createdAtText):null;
return d&&!isNaN(d)?d.toLocaleString('pt-BR'):'agora'}

export function chatConversationId(a='',b=''){return [String(a).toLowerCase(),
String(b).toLowerCase()].sort().join('::')}

export function chatParticipants(a='',b=''){return [String(a||'').toLowerCase(),
String(b||'').toLowerCase()].filter(Boolean).sort()}

export function chatDiaRotulo(m){
 const d=m?.createdAt?.toDate?.()||(m?.createdAtText?new Date(m.createdAtText):null);
 if(!d||isNaN(d))return '';
 const hoje=new Date(),ontem=new Date();ontem.setDate(hoje.getDate()-1);
 const mesmo=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
 if(mesmo(d,hoje))return 'Hoje';
 if(mesmo(d,ontem))return 'Ontem';
 return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});
}

export function chatMinutoDe(m){
 const d=m?.createdAt?.toDate?.()||(m?.createdAtText?new Date(m.createdAtText):null);
 return d&&!isNaN(d)?Math.floor(d.getTime()/60000):0;
}
