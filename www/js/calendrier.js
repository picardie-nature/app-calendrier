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
			/*for (var i=0; i<data.sorties.length; i++) {
				$('#maj_log').append("Sortie : "+data.sorties[i].nom_sortie+"<br/>");
			}*/
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
			$('#maj_log').append(s.nom_sortie+"<br/>");
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
			$('#typ_log').html('init<br/>');
			var re_type = /^type-/;
			$('#liste_types').html("");
			for (var i=0;i<localStorage.length;i++) {
				var k = localStorage.key(i);
				if (k.match(re_type)) {
					var id = k.split('-')[1];
					$('#typ_log').append('add '+k+'<br/>');
					//var html = "<li>"+localStorage[k]+"</li>";
					//$('#liste_types').append(html);
					$('#liste_types').append(
						"<li><a href='javascript:;' "+
						"class='btn_liste_type_sorties' "+
						"type_sortie='"+id+"'>"+
						localStorage[k]+
						"</a>"+
						"</li>"
					).listview('refresh');
				}
			}
			$('.btn_liste_type_sorties').click(function (e) {
				$('#liste_sorties').attr('type_sortie', $(this).attr('type_sortie'));
				$.mobile.navigate("#liste_sorties");
			});
		}
	);
	$('#liste_sorties').on("pageshow", function(evt) {
			$('#ls_log').html("type_sortie="+$(this).attr('type_sortie')+"<br/>");
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
			$('#ls_log').append("terminé<br/>");
		}
	);
}
