Array.prototype.removeItem = function (n) {
	for (var i=n; i<this.length-1;i++) {
		this[i] = this[i+1];
	}
	this.pop();
}

var etats = {
	1: "Proposé",
	2: "Pas retenue",
	3: "Valide",
	4: "Annulée"
}
function charger_calendrier() {
	$('#maj_log').append("Téléchargement de la mise à jour....<br/>");
	var url = "http://sorties.picardie-nature.org/?t=export_json";
	var key = "shu9eiLelohgh1aW"; // c'est pas un grand secret ;-)

	var net_ok = false;
	if (navigator.connection.type == Connection.WIFI) { net_ok = true }
	else if (navigator.connection.type == Connection.CELL_3G) { net_ok = true }
	else if (navigator.connection.type == Connection.CELL_4G) { net_ok = true }
	else if (navigator.connection.type == Connection.ETHERNET) { net_ok = true }

	if (!net_ok) {
		navigator.notification.alert("Pas de connection Internet", null, "Erreur", "Ok");
		return;
	}

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

function nettoyer_localStorage() {
	$('#maj_log').append("nettoyage de la base ...<br>");
	var re_sortie = /^sortie-/;
	for (var i=0;i<localStorage.length;i++) {
		var k = localStorage.key(i);
		if (k.match(re_sortie)) {
			localStorage.removeItem(k);
		}
	}
	$('#maj_log').append("nettoyage terminé<br>");
}

function sauve_calendrier(cal) {
	nettoyer_localStorage();
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
	for (var i=0;i<cal.cadres_sortie.length;i++) {
		var cle ="cadre-"+cal.cadres_sortie[i].id_sortie_cadre;
		localStorage.setItem(cle, cal.cadres_sortie[i].lib);
	}
	var d = new Date(Date.now());
	localStorage.setItem('derniere_maj', d.toString());
	$('#maj_log').append("Enregistrement terminé "+localStorage.length+ " éléments<br/>");
}

function construire_index_calendrier() {
	$('#maj_log').append('Indexation<br/>');
	var index_types = {};
	var index_reseaux = {};
	var index_cadres = {};
	var index_dates = [];
	var re_sortie = /^sortie-/;
	var aujourdhui = new Date(Date.now());
	function pad(n) {
		if (n<10)
			return "0"+n;
		return n.toString();
	}
	for (var i=0;i<localStorage.length;i++) {
		var k = localStorage.key(i);
		var v = localStorage[k];

		if (k.match(re_sortie)) {
			var s = undefined;
			try {
				var s = JSON.parse(v);
			} catch (e) {
				$('#maj_log').append("pas reussi a parser "+v);
			}
			var n_date_ok = 0;
			for (var j=0;j<s.date_sortie.length;j++) {
				var etat = parseInt(s.date_sortie[j].etat);
				if (etat < 3) continue; // en attente ou pas retenue
				var d = new Date(s.date_sortie[j].date_sortie);
				if (d < aujourdhui) continue; // ne pas mettre ce qui est déjà passé
				var dk = pad(d.getFullYear())+"-"+pad(d.getMonth())+"-"+pad(d.getDate())+"-"+pad(d.getHours())+"-"+pad(d.getMinutes())+"-"+s.id_sortie+"-"+j;
				index_dates.push(dk);
				n_date_ok += 1;
			}
			if (n_date_ok == 0)
				continue;
			if (index_types[s.id_sortie_type] == undefined) {
				index_types[s.id_sortie_type] = [s.id_sortie];
			} else {
				index_types[s.id_sortie_type].push(s.id_sortie);
			}
			if (index_reseaux[s.id_sortie_reseau] == undefined) {
				index_reseaux[s.id_sortie_reseau] = [s.id_sortie];
			} else {
				index_reseaux[s.id_sortie_reseau].push(s.id_sortie);
			}
			if (index_cadres[s.id_sortie_cadre] == undefined) {
				index_cadres[s.id_sortie_cadre] = [s.id_sortie_cadre];
			} else {
				index_cadres[s.id_sortie_cadre].push(s.id_sortie_cadre);
			}
		}
	}
	localStorage['index_types'] = JSON.stringify(index_types);
	localStorage['index_reseaux'] = JSON.stringify(index_reseaux);
	localStorage['index_cadres'] = JSON.stringify(index_cadres);

	// indexation par date
	// format le la cle yyyy-mm-dd-hh-mm-id_sortie-offsetdate
	index_dates.sort();
	localStorage['index_dates'] = JSON.stringify(index_dates);
	$('#maj_log').append('Indexation terminée, vous pouvez consulter le calendrier<br/>');
}

function est_dans_les_favoris(id_sortie) {
	if (localStorage['index_favoris'] != undefined) {
		var index_favoris = JSON.parse(localStorage['index_favoris']);
		return (index_favoris.indexOf(id_sortie) != -1);
	}
	return false;
}

function ajouter_ou_retirer_aux_favoris() {
	var index_favoris;
	var id_sortie = $('#sortie').attr('id_sortie');
	var b_fav = $('#btn_ajout_favoris');

	if (localStorage['index_favoris'] == undefined) {
		index_favoris = [];
	} else {
		index_favoris = JSON.parse(localStorage['index_favoris']);
	}
	if (index_favoris.indexOf(id_sortie) == -1) {
		index_favoris.push(id_sortie);
		if (!b_fav.hasClass('favoris')) b_fav.addClass('favoris');
	} else {
		index_favoris.removeItem(index_favoris.indexOf(id_sortie));
		if (b_fav.hasClass('favoris')) b_fav.removeClass('favoris');
	}
	localStorage.setItem('index_favoris', JSON.stringify(index_favoris));
}

function sortie_tri_dates(sortie) {
	sortie.date_sortie.sort(function (a,b) {
		var da = new Date(a.date_sortie);
		var db = new Date(b.date_sortie);
		if (da < db) return -1;
		if (da > db) return 1;
		return 0;
	});
}

function sortie_premiere_date(sortie) {
	// a utiliser après sortie_tri_dates()
	var now = Date.now();
	var txt;
	for (var i=0;i<sortie.date_sortie.length;i++) {
		var d = new Date(sortie.date_sortie[i].date_sortie);
		if (d > now) {
			txt = d.toLocaleDateString('fr-fr',{weekday: "long", year: "numeric", month: "long", day: "numeric"});
			var reste = sortie.date_sortie.length-i-1;
			if (reste == 1) txt += " + une autre date";
			if (reste > 1) txt += " + "+reste+" autres dates";
			return txt;
		}
	}
	return "pas de prochaine date "+sortie.date_sortie.length;
}

function liste_sorties_attr_reset() {
	$('#liste_sorties').attr("id_reseau", -1);
	$('#liste_sorties').attr("id_cadre", -1);
	$('#liste_sorties').attr("type_sortie", -1);
	$('#liste_sorties').attr("favoris", -1);
}

function init_calendrier() {
	$('#btn_mettre_a_jour').click(charger_calendrier);
	$('#btn_ajout_favoris').click(ajouter_ou_retirer_aux_favoris);
	$('#btn_ouvre_favoris').click(function (e) {
		liste_sorties_attr_reset();
		$('#liste_sorties').attr("favoris", 1);
		$.mobile.navigate("#liste_sorties");
	});
	$('#toutes').click(function (e) {
		liste_sorties_attr_reset();
		$.mobile.navigate("#liste_sorties");
	});

	function aff_liste_cles(k_index, re, ul_id, classe_btn, attr_page_sortie) {
		var ul = $('#'+ul_id);
		if (localStorage[k_index] == undefined) {
			navigator.notification.alert("Index manquant, synchronisez à nouveau le calendrier", null, "Erreur", "Ok");
			return;
		}
		var index = JSON.parse(localStorage[k_index]);
		ul.html("");
		var keys = [];
		for (var i=0;i<localStorage.length;i++) {
			var k = localStorage.key(i); 
			if (k.match(re)) { 
				var id = k.split('-')[1]; 
				var count; 
				try { 
					count = index[id].length; 
				} catch (e) { 
					count = 0;
				}
				if (count > 0) {
					keys.push({kid: k, lib: localStorage[k], count: count});
				}
			}
		}
		keys.sort(function (a,b) {
			if (a.lib > b.lib) return 1;
			if (a.lib < b.lib) return -1;
			return 0;
		});
		for (var i=0;i<keys.length;i++) {
			var id = keys[i].kid.split('-')[1]; 
			ul.append(
				"<li><a href='javascript:;' "+
				"class='"+classe_btn+"' "+
				"id_filtre='"+id+"'>"+
				keys[i].lib+
				"<span class='ui-li-count'>"+keys[i].count+"</span>"+
				"</a>"+
				"</li>"
			);
		}
		ul.listview('refresh');
		liste_sorties_attr_reset();
		$('.'+classe_btn).click(function (e) {
			$('#liste_sorties').attr(attr_page_sortie, $(this).attr('id_filtre'));
			$.mobile.navigate("#liste_sorties");
		});
	}
	$('#home').on("pagebeforeshow", function (evt) {
		var txt = "Date de dernière mise à jour inconnue, lancez une mise à jour";
		if (localStorage['derniere_maj'] != undefined) {
			var d = new Date(localStorage['derniere_maj']);
			txt = "dernière actualisation : ";
			txt += d.toLocaleDateString('fr-fr',{weekday: "long", year: "numeric", month: "long", day: "numeric"});
		}
		$("#home_derniere_synchro").html(txt);
		$("#maj_log").html('');
	});
	$('#types').on("pagebeforeshow", function(evt) {
		aff_liste_cles("index_types", /^type-/, 'liste_types', 'btn_liste_type_sortie', 'type_sortie');
	});
	$('#reseaux').on("pagebeforeshow", function(evt) {
		aff_liste_cles("index_reseaux", /^reseau-/, 'liste_reseaux', 'btn_liste_reseau', "id_reseau");
	});
	$('#cadres').on("pagebeforeshow", function(evt) {
		aff_liste_cles("index_cadres", /^cadre-/, 'liste_cadres', 'btn_liste_cadre', "id_cadre");
	});
	$('#liste_sorties').on("pagebeforeshow", function(evt) {
			var type_sortie = parseInt($(this).attr('type_sortie'));
			var id_reseau = parseInt($(this).attr('id_reseau'));
			var id_cadre = parseInt($(this).attr('id_cadre'));
			var afficher_favoris = ($(this).attr('favoris') == 1);
			var favoris = [];
			if (afficher_favoris) {
				if (localStorage['index_favoris'] != undefined) {
					try {
						favoris = JSON.parse(localStorage['index_favoris']);
					} catch (e) {
						navigator.notification.alert("Il y a un problème avec la préselection, l'index corrompu va être effacé", null, "Erreur", "Ok");
						localStorage.removeItem("index_favoris");
						favoris = [];
					}
				}
			}
			if (type_sortie == -1) type_sortie = undefined;
			if (id_reseau == -1) id_reseau = undefined;
			if (id_cadre == -1) id_cadre = undefined;
			$('#lv_sorties').html("");
			var index_dates = JSON.parse(localStorage['index_dates']);
			var n_visible = 0;
			for (var i=0;i<index_dates.length;i++) {
				var index_key = index_dates[i].split('-');
				var id = index_key[5];
				var jour = index_key[6];
				if (!localStorage["sortie-"+id]) {
					navigator.notification.alert("La sortie "+id+" existe pas", null, "Erreur", "Ok");
				}
				if (afficher_favoris) {
					if (favoris.indexOf(id) == -1) {
						continue;
					}
				}
				var sortie = JSON.parse(localStorage["sortie-"+id]);
				if (type_sortie != undefined) {
					if (sortie.id_sortie_type != type_sortie)
						continue;
				} else if (id_reseau != undefined) {
					if (sortie.id_sortie_reseau != id_reseau)
						continue;
				} else if (id_cadre != undefined) {
					if (sortie.id_sortie_cadre != id_cadre)
						continue;
				}
				n_visible += 1;
				var date = new Date(sortie.date_sortie[jour].date_sortie)
				date = date.toLocaleDateString('fr-fr',{weekday: "long", year: "numeric", month: "long", day: "numeric"});
				$('#lv_sorties').append(
					"<li><a href='javascript:;' "+
					"class='btn_liste_sortie' "+
					"id_sortie="+id+" >"+
					"<h2>"+sortie.nom_sortie+"</h2>"+
					"<p>"+date+"</p>"+
					"<p class=ui-li-aside>"+sortie.departement+"</p>"+
					"</a></li>"
				);
			}
			$('#lv_sorties').listview('refresh');
			$('.btn_liste_sortie').click(function (e) {
				$('#sortie').attr('id_sortie', $(this).attr('id_sortie'));
				$.mobile.navigate("#sortie");
			});
			if (n_visible == 0) {
				navigator.notification.alert("Aucune activité affichée, faites une mise à jour du calendrier", null, "Erreur", "Ok");
				$.mobile.navigate("#home");
			}
		}
	);
	$('#sortie').on("pagebeforeshow", function (evt) {
			var id = $(this).attr('id_sortie');
			//$('#s_log').html("id_sortie = "+id+"<br/>");
			var json = localStorage["sortie-"+id]
			//$('#s_log').append(json+"<br/>");
			var sortie = JSON.parse(json);

			var b_fav = $('#btn_ajout_favoris');
			if (est_dans_les_favoris(id)) {
				if (!b_fav.hasClass('favoris')) {
					b_fav.addClass('favoris');
				}
			} else {
				if (b_fav.hasClass('favoris'))
					b_fav.removeClass('favoris');
			}

			if (sortie.accessible_mobilite_reduite == 1) $('#accessible_mobilite_reduite').show();
			else $('#accessible_mobilite_reduite').hide();

			$('#s_titre').html(sortie.nom_sortie);
			$('#s_description').html(sortie.desc);
			if (sortie.departement.length > 0) {
				$('#s_commune').html(sortie.commune);
				$('#s_departement').html(sortie.departement);
				$('#s_z_commune').show();
			} else {
				$('#s_z_commune').hide();
			}
			
			$('#s_dates').html("");
			sortie_tri_dates(sortie);
			var options_date = {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"};
			var now = Date.now();
			for (var i=0; i<sortie.date_sortie.length; i++) {
				var d = sortie.date_sortie[i];
				var obj_date = new Date(d.date_sortie);

				if (obj_date < now) continue;
				if (d.etat < 3) continue;

				var html = "<p class='date_"+d.etat+"'>"+obj_date.toLocaleDateString('fr-fr',options_date);
				if (d.inscription_prealable == true) 
					html + "<span class='ins_prealable'>sur inscription</span>";
				html += "<br/>";
				html += "</p>";
				$('#s_dates').append(html);
			}
			$("#s_description_lieu").html(sortie.description_lieu);
			$('#s_public').html(localStorage["public-"+sortie.id_sortie_public]);
			/*
			$('#s_log').append("terminé<br/>");

			var keys = Object.keys(sortie);
			for (var i=0; i<keys.length; i++) {
				$("#s_log").append("key : "+keys[i]+"<br>");
			}
			$('#s_log').append("pole "+sortie.pole+"<br>");
			*/
		}
	);
}
