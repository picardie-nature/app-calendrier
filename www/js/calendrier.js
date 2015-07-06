function charger_calendrier() {
	$('#maj_log').append("Téléchargement de la mise à jour....<br/>");
	var url = "http://sorties.picardie-nature.org/?t=export_json";
	var key = "shu9eiLelohgh1aW"; // c'est pas un grand secret ;-)
	$.ajax({
		dataType: "json",
		url: url,
		data: {key: key},
		success: function(data,txtstatus,xhr) {
			$('#maj_log').append("Téléchargement terminé<br/>");
			$('#maj_log').append(data.sorties.length+" sorties<br/>");
			sauve_calendrier(data);
			construire_index_calendrier();

		},
		method: "post",
		error: function (xhr,txtstatus,err) {
			$('#maj_log').append("Une erreur c'est produite pendant le téléchargement<br/>"+txtstatus+"<br/>");
		}
	});
}

function sauve_calendrier(cal) {
	for (var i=0;i<cal.sorties.length; i++) {
		var nouvel_cle = "sortie-"+cal.sorties[i].id_sortie;
		localStorage.setItem(nouvel_cle, JSON.stringify(cal.sorties[i]));
	}
	for (var i=0;i<cal.types_sortie.length;i++) {
		var cle = "type-"+cal.types_sortie[i].id_sortie_type;
		localStorage.setItem(cle, cal.types_sortie[i].lib);
	}
	for (var i=0;i<cal.publics_sortie.length;i++) {
		var cle ="public-"+cal.publics_sortie[i].id_sortie_public;
		localStorage.setItem(cle, cal.publics_sortie[i].lib);
	}
	for (var i=0;i<cal.materiels_sortie.length;i++) {
		var cle ="materiel-"+cal.materiels_sortie[i].id_sortie_materiel;
		localStorage.setItem(cle, cal.materiels_sortie[i].lib);
	}
	for (var i=0;i<cal.reseaux_sortie.length;i++) {
		var cle ="reseau-"+cal.reseaux_sortie[i].id_sortie_reseau;
		localStorage.setItem(cle, cal.reseaux_sortie[i].lib);
	}
	for (var i=0;i<cal.poles_sortie.length;i++) {
		var cle ="pole-"+cal.poles_sortie[i].id_sortie_pole;
		localStorage.setItem(cle, cal.poles_sortie[i].lib);
	}
	$('#maj_log').append("Enregistrement terminé "+localStorage.length+ " éléments<br/>");
}

function construire_index_calendrier() {
	$('#maj_log').append('Indexation<br/>');
	var index_types = {};
	var index_dates = {};
	for (var i=0;i<localStorage.length;i++) {
		var k = localStorage.key(i);
		var v = localStorage[k];

		var re_sortie = /^sortie-/;
		if (k.match(re_sortie)) {
			var s = undefined;
			try {
				var s = JSON.parse(v);
			} catch (e) {
				$('#maj_log').append("pas reussi a parser "+v);
			}
			if (index_types[s.id_sortie_type] == undefined) {
				index_types[s.id_sortie_type] = [s.id_sortie];
			} else {
				index_types[s.id_sortie_type].push(s.id_sortie);
			}
		}
	}
	localStorage['index_types'] = JSON.stringify(index_types);
	$('#maj_log').append('Indexation terminée<br/>');
}

function init_calendrier() {
	$('#btn_mettre_a_jour').click(charger_calendrier);

	$('#types').on("pageshow", function(evt) {
			$('#typ_log').html('');
			var re_type = /^type-/;
			$('#liste_types').html("");
			var index_types =  JSON.parse(localStorage['index_types']);
			for (var i=0;i<localStorage.length;i++) {
				var k = localStorage.key(i);
				if (k.match(re_type)) {
					var id = k.split('-')[1];
					//$('#typ_log').append('add '+k+'<br/>');
					var span_count;
					try {
						span_count = index_types[id].length;
					} catch (e) {
						span_count = 0;
					}
					if (span_count > 0) {
						$('#liste_types').append(
							"<li><a href='javascript:;' "+
							"class='btn_liste_type_sorties' "+
							"type_sortie='"+id+"'>"+
							localStorage[k]+
							"<span class='ui-li-count'>"+span_count+"</span>"+
							"</a>"+
							"</li>"
						).listview('refresh');
					}
				}
			}
			$('.btn_liste_type_sorties').click(function (e) {
				$('#liste_sorties').attr('type_sortie', $(this).attr('type_sortie'));
				$.mobile.navigate("#liste_sorties");
			});
		}
	);

	$('#liste_sorties').on("pageshow", function(evt) {
			//$('#ls_log').html("type_sortie="+$(this).attr('type_sortie')+"<br/>");
			var type_sortie = $(this).attr('type_sortie');
			if (type_sortie == -1) type_sortie = undefined;
			var re_sortie = /^sortie-/;
			$('#lv_sorties').html("");
			for (var i=0;i<localStorage.length;i++) {	
				var k = localStorage.key(i);
				if (k.match(re_sortie)) {
					var id = k.split('-')[1];
					var sortie = JSON.parse(localStorage[k]);
					if (type_sortie != undefined) {
						// tester si les parseInt() sont necessaire
						if (parseInt(sortie.id_sortie_type) != parseInt(type_sortie)) {
							continue;
						}
					}
					$('#lv_sorties').append(
						"<li><a href='javascript:;' "+
						"class='btn_liste_sortie' "+
						"id_sortie="+id+" >"+sortie.nom_sortie+"</a></li>"
					);
				}
			}
			$('#lv_sorties').listview('refresh');
			$('.btn_liste_sortie').click(function (e) {
				$('#sortie').attr('id_sortie', $(this).attr('id_sortie'));
				$.mobile.navigate("#sortie");
			});
		}
	);

	$('#sortie').on("pageshow", function (evt) {
			var id = $(this).attr('id_sortie');
			$('#s_log').html("id_sortie = "+id+"<br/>");
			var json = localStorage["sortie-"+id]
			$('#s_log').append(json+"<br/>");
			var sortie = JSON.parse(json);

			$('#s_titre').html(sortie.nom_sortie);
			$('#s_description').html(sortie.desc);
			$('#s_commune').html(sortie.commune);
			$('#s_departement').html(sortie.departement);
			
			$('#s_dates').html("");
			sortie.date_sortie.sort(function (a,b) {
				var da = new Date(a.date_sortie);
				var db = new Date(b.date_sortie);
				if (da < db) return -1;
				if (da > db) return 1;
				return 0;
			});
			var options_date = {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"};
			var now = Date.now();
			for (var i=0; i<sortie.date_sortie.length; i++) {
				var d = sortie.date_sortie[i];
				var obj_date = new Date(d.date_sortie);

				if (obj_date < now) continue;

				var html = "<p class='date_"+d.etat+"'>"+obj_date.toLocaleDateString('fr-fr',options_date);
				if (d.inscription_prealable) 
					html + "<span class='ins_prealable'>sur inscription</span>";
				html += "<br/>";
				html += "</p>";
				$('#s_dates').append(html);
			}
			$("#s_description_lieu").html(sortie.description_lieu);
			$('#s_log').append("terminé<br/>");
		}
	);
}
