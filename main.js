var rawData = null;
var kategorien = {
    penrt: {title: "PENRT", unit: "TJ"},
    gwp: {title: "GWP", unit: "t CO2-Eq"},
    ap: {title: "AP", unit: "kg SO2-Eq"}
};

var colors = ["dodgerblue", "firebrick"];

var format = function(value){return d3.format(",")(value).replace(/,/g, ' ').replace(/\./, ',')};

document.querySelectorAll('.optionlabel').forEach(
    function(label){
        var timeout = null;
        label.addEventListener("mouseover",function(){
           timeout = setTimeout(function(){label.nextElementSibling.style.opacity = 1;},500);
        });
        label.addEventListener("mouseout",function(){
            if(timeout != null){
                clearTimeout(timeout);
                label.nextElementSibling.style.opacity = 0;
            }
        });
    }
);

document.querySelectorAll('input[name="wk"]').forEach(
    function (wk) {
        wk.addEventListener("change", onWirkungskategorienChanged);
    }
);

document.querySelectorAll('input[name="charttype"]').forEach(
    function (wk) {
        wk.addEventListener("change", onChartTypeChanged);
    }
);

var remainingAsyncCalls = 2;
//load data
var resultMap = {};
var lineChartMap = {};
var client = new XMLHttpRequest();
var client2 = new XMLHttpRequest();
client.open('GET', "barChartData2.CSV");
client2.open('GET', "LineChartData3.CSV");
client.addEventListener("load", function () {
    var yearsOfUse = 30;
    var lines = client.responseText.split("\n");
    lines.forEach(function (line) {
        // line = line.replace(",", ".");
        var columns = line.split(";");
        var name = columns[5];
        var variante = {name: name};

        for (var i = 0; i <= 11; i = i + 3) {
            var herstellung = parseFloat(columns[i + 6]);
            var nutzung = parseFloat(columns[i + 7]) * yearsOfUse;
            var rueckbau = parseFloat(columns[i + 8]);
            var kategorie = {herstellung: herstellung, nutzung: nutzung, rueckbau: rueckbau};
            variante[Object.keys(kategorien)[i / 3]] = kategorie;
        }
        resultMap[name] = variante;
    });
    remainingAsyncCalls--;
    if(remainingAsyncCalls == 0){
        showDiagramms();
    }
});

client2.addEventListener("load", function() {
    var lines = client2.responseText.split("\n");
    var rueckbau_bestand_gwp = lines[0].replace(",", ".").split(";")[0];
    var rueckbau_bestand_penrt = lines[0].replace(",", ".").split(";")[1];
    var rueckbau_bestand_ap = lines[0].replace(",", ".").split(";")[2];
    lines.forEach(function (line) {
        line = line.replace(",", ".");
        var columns = line.split(";");
        var name = columns[0];
        var p1_penrt = {x: 2017, y: parseFloat(columns[6])};
        var p2_penrt = {x: 2047, y: parseFloat(columns[6]) + 30 * parseFloat(columns[7])};
        var p3_penrt = {x: 2047.5, y: p2_penrt.y - parseFloat(rueckbau_bestand_penrt) - parseFloat(columns[8])};
        var p1_gwp = {x: 2017, y: parseFloat(columns[3])};
        var p2_gwp = {x: 2047, y: parseFloat(columns[3]) + 30 * parseFloat(columns[4])};
        var p3_gwp = {x: 2047.5, y: p2_gwp.y + parseFloat(rueckbau_bestand_gwp) + parseFloat(columns[5]) };
        var p1_ap = {x: 2017, y: parseFloat(columns[9])};
        var p2_ap = {x: 2047, y: parseFloat(columns[9]) + 30 * parseFloat(columns[10])};
        var p3_ap = {x: 2047.5, y: p2_ap.y + parseFloat(rueckbau_bestand_ap) + parseFloat(columns[11]) };
        lineChartMap[name] = {name: name, 
            penrt: [p1_penrt, p2_penrt, p3_penrt], 
            gwp: [p1_gwp, p2_gwp, p3_gwp],
            ap: [p1_ap, p2_ap, p3_ap]
        };
    });
    var data = [];
    Object.keys(lineChartMap).forEach(function(key) {
       data.push(lineChartMap[key]);
    });
    var chartContainer = document.getElementById("ds456chartContainer");
    var id = "ds456chart" + "penrt";
    var container = document.createElement("div");
    container.setAttribute("id", id);
    container.setAttribute("class", "ds456chart");
    chartContainer.appendChild(container);
    remainingAsyncCalls--;
    if(remainingAsyncCalls == 0){
        showDiagramms();
    }
});

client.send();
client2.send();

function showDiagramms() {
    document.getElementById("ds456loader").style.display = "none";
    onChartTypeChanged();
}

function onChartTypeChanged() {
    var chartIds = getPresentChartIds();
    chartIds.forEach(function (id) {
        var element = document.getElementById(id);
        element.parentNode.removeChild(element);
    });
    var chartType = getChartType();
    var opacity = chartType == "barchart" ? 1 : 0;
    document.getElementById("ds456legendeContainer").style.opacity = opacity;
    if(chartType !== "barchart") {
        document.querySelectorAll('input[name="wk"]').forEach(
            function (wk){
                if(wk.value !== "gwp" && wk.value !== "penrt" && wk.value !== "ap") {
                    wk.checked = false;
                    wk.disabled = true;
                }
            }
        );
    }else {
        document.querySelectorAll('input[name="wk"]').forEach(
            function (wk){
                wk.disabled = false;
            }
        );
    }
    onWirkungskategorienChanged();
}

function onWirkungskategorienChanged() {
    var wks = getWirkungskategorien();
    var chartType = getChartType();
    var dataSource = chartType == "barchart" ? resultMap : lineChartMap;
    var defaultVariante = chartType == "barchart" ? new Variante() : new Variante2();
    var key1 = getKey(1);
    var key2 = getKey(2);
    var variante1 = dataSource[key1] != undefined ? dataSource[key1] : defaultVariante;
    var variante2 = dataSource[key2] != undefined ? dataSource[key2] : defaultVariante;
    var chartContainer = document.getElementById("ds456chartContainer");
    var chartIds = getPresentChartIds();
    var charts = [];
    wks.forEach(function (wk, index) {
        if (!(chartIds.includes("ds456chart" + wk))) {
            var id = "ds456chart" + wk;
            var container = document.createElement("div");
            container.setAttribute("id", id);
            container.setAttribute("class", "ds456chart");
            chartContainer.appendChild(container);
            if(chartType == "barchart"){
                charts.push(new BarChart([variante1, variante2], id, wk, kategorien[wk].title, kategorien[wk].unit));
            }else{
                charts.push(new LineChart([variante1, variante2], id, wk, kategorien[wk].title, kategorien[wk].unit));
            }

        }
    });
    var deletedElements = chartIds.filter(function (id) {
        return !(wks.includes(id.slice(10)));
    });
    deletedElements.forEach(function (id) {
        var element = document.getElementById(id);
        element.parentNode.removeChild(element);
    });
    document.querySelectorAll('.ds456radiogroup2 input').forEach(
        function (radiobutton) {
            radiobutton.addEventListener("click", function () {
                onSelected(charts);
            });
        }
    )
}

function getPresentChartIds() {
    result = [];
    document.querySelectorAll(".ds456chart").forEach(
        function (chart) {
            result.push(chart.id);
        }
    );
    return result;
}

function onSelected(charts) {
    var key1 = getKey(1);
    var key2 = getKey(2);
    var chartType = getChartType();
    var dataSource = chartType == "barchart" ? resultMap : lineChartMap;
    var defaultVariante = chartType == "barchart" ? new Variante() : new Variante2();
    var variante1 = dataSource[key1] != undefined ? dataSource[key1] : defaultVariante;
    var variante2 = dataSource[key2] != undefined ? dataSource[key2] : defaultVariante;
    charts.forEach(function (chart) {
        chart.update([variante1, variante2], "all");
    });
}

function getRadioValue(value) {
    return document.querySelector('input[name=' + value + ']:checked').value;
}

function getWirkungskategorien() {
    result = [];
    var wks = document.querySelectorAll('input[name="wk"]:checked').forEach(
        function (wk) {
            result.push(wk.value);
        }
    );
    return result;
}

function getChartType() {
    return document.querySelector('input[name="charttype"]:checked').value;
}

function Variante() {
    var self = this;
    Object.keys(kategorien).forEach(function (kategorie) {
        self[kategorie] = {herstellung: 0, nutzung: 0, rueckbau: 0};
    })
}

function Variante2() {
    this.penrt = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}];
    this.gwp = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}];
}

function getKey(value) {
    var standard = getRadioValue("Standard" + value);
    var tga = getRadioValue("TGA" + value);
    var fenster = getRadioValue("Fenster" + value);
    var waermedaemmung = getRadioValue("Waermedaemmung" + value);
    var waermebruecken = getRadioValue("Waermebruecken" + value);
    var solarthermie = getRadioValue("Solarthermie" + value);
    if (standard !== "EnEv2016" && fenster !== "3WSV") {
        showInfo("Der Energiestandard ist nur mit mehrfach verglasten Fenstern zu erreichen", colors[value-1]);
    }
    return solarthermie ? [standard, fenster, waermedaemmung, tga, waermebruecken, solarthermie].join("_") : [standard, fenster, waermedaemmung, tga, waermebruecken].join("_");
}

function posF(value) {
    return value > 0 ? value : 0;
}

function negF(value) {
    return value < 0 ? value : 0;
}

function BarChart(data, containerId, kategorie, title, unit) {

    var width = 250;
    var height = 300;
    var marginLeft = 90;
    var marginBottom = 20;
    var barMarginLeft = 20;
    var barWidth = 45;
    var barDistance = 10;

    /*var img = document.createElement("img");
    img.setAttribute("src", kategorie + ".png");
    img.setAttribute("style", "width:50px;");
    document.getElementById(containerId).appendChild(img);*/

    var charTitle = document.createElement("span");
    charTitle.setAttribute("class", "ds456charttitle");
    charTitle.innerHTML = title + "<span style='font-size:10px'>[" + unit +"]</span>";
    document.getElementById(containerId).appendChild(charTitle);

    //create svg
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis
    svg.append("g")
        .attr("transform", "translate(" + marginLeft + ", " + 0 + ")")
        .attr("id", "ds456axis" + containerId).style("font-size", "13px");

    // svg.append("text").text("[" + unit + "]").attr("transform", "translate(" + (width-20) + ", 80) rotate(90)");

    svg.append("circle")
        .attr("r", 5)
        .attr("fill", colors[0])
        .attr("cx", marginLeft + barMarginLeft + barWidth / 2)
        .attr("cy", height - 10);
    svg.append("circle")
        .attr("r", 5)
        .attr("fill", colors[1])
        .attr("cx", marginLeft + barMarginLeft + barDistance + 1.5 * barWidth)
        .attr("cy", height - 10);

    this.update = function update(data, cyclePhase) {

        var workingData = [];
        data.forEach(function(variante) {
            var herstellung = cyclePhase == "herstellung" || cyclePhase == "all" ? variante[kategorie].herstellung : 0;
            var nutzung = cyclePhase == "nutzung" || cyclePhase == "all" ? variante[kategorie].nutzung : 0;
            var rueckbau = cyclePhase == "rueckbau" || cyclePhase == "all" ? variante[kategorie].rueckbau : 0;
            var obj = {};
            obj[kategorie] = {herstellung: herstellung, nutzung: nutzung, rueckbau: rueckbau};
            workingData.push(obj);
        });

        // get Scale dimensions
        var max_Value = 0;
        var min_Value = 0;
        workingData.forEach(function (variante) {
            var herstellung = variante[kategorie].herstellung;
            var nutzung = variante[kategorie].nutzung;
            var rueckbau = variante[kategorie].rueckbau;
            if (posF(herstellung) + posF(nutzung) + posF(rueckbau) > max_Value) {
                max_Value = posF(herstellung) + posF(nutzung) + posF(rueckbau);
            }
            if (negF(herstellung) + negF(nutzung) + negF(rueckbau) < min_Value) {
                min_Value = negF(herstellung) + negF(nutzung) + negF(rueckbau);
            }
        });
        var scale = d3.scaleLinear().domain([min_Value, max_Value]).range([height - marginBottom, 20]);

        //create axis and set tick-format
        var axis = d3.axisLeft(scale).ticks(5).tickFormat(format);

        d3.select("#ds456axis" + containerId).call(axis);

        //bind data
        var varianten = svg.selectAll(".ds456variante")
            .data(workingData, function (d) {
                return d.name
            });

        //exit
        //-------------------------------------------------
        varianten.exit().remove();

        //enter
        //-------------------------------------------------

        //add groups for varianten
        var new_varianten = varianten.enter()
            .append("g")
            .attr("class", "ds456variante")
            .attr("kategorie", kategorie);

        new_varianten.append("rect").attr("class", "ds456rect_herstellung");
        new_varianten.append("rect").attr("class", "ds456rect_nutzung");
        new_varianten.append("rect").attr("class", "ds456rect_rueckbau").on("click",function(){update(data, "rueckbau")});;

        //update (all)
        //--------------------------------------------------------------------
        function yHerstellung(value) {
            if (value > 0) {
                return scale(value);
            } else {
                return scale(value) - scale(0) + scale(Math.abs(value));
            }
        }

        new_varianten.merge(varianten).select(".ds456rect_herstellung")
            .attr("width", barWidth)
            .attr("transform", function (d, i) {
                var x = marginLeft + barMarginLeft + i * (barWidth + barDistance);
                var y = yHerstellung(d[kategorie].herstellung);
                return "translate(" + x + ", " + y + ")";
            })
            .style("fill", function (d) {
                return "lightblue";
            })
            .attr("height", function (d) {
                return scale(0) - scale(Math.abs(d[kategorie].herstellung))
            }).on("click",cyclePhase == "herstellung" ? function(){update(data, "all")} : function(){update(data, "herstellung")});


        new_varianten.merge(varianten).select(".ds456rect_nutzung")
            .attr("width", barWidth)
            .style("fill", function (d) {
                return "orange";
            })
            .attr("transform", function (d, i) {
                var x = marginLeft + barMarginLeft + i * (barWidth + barDistance);
                var y;
                if ((d[kategorie].herstellung > 0) == (d[kategorie].nutzung >= 0)) {
                    if (d[kategorie].nutzung > 0) {
                        y = scale(d[kategorie].nutzung) - scale(0) + scale(Math.abs(d[kategorie].herstellung));
                    } else {
                        y = scale(d[kategorie].herstellung);
                    }
                } else {
                    y = yHerstellung(d[kategorie].nutzung);
                }
                return "translate(" + x + ", " + y + ")";
            })
            .attr("height", function (d) {
                return scale(0) - scale(Math.abs(d[kategorie].nutzung))
            }).on("click",cyclePhase == "nutzung" ? function(){update(data, "all")} : function(){update(data, "nutzung")});

        new_varianten.merge(varianten).select(".ds456rect_rueckbau")
            .attr("width", barWidth)
            .attr("height", function (d) {
                return scale(0) - scale(Math.abs(d[kategorie].rueckbau))
            })
            .attr("transform", function (d, i) {
                var x = marginLeft + barMarginLeft + i * (barWidth + barDistance);
                var y;
                var posPart = posF(d[kategorie].herstellung) + posF(d[kategorie].nutzung);
                var negPart = negF(d[kategorie].herstellung) + negF(d[kategorie].nutzung);
                if (negPart == 0 && d[kategorie].rueckbau < 0 || posPart == 0 && d[kategorie].rueckbau >= 0) {
                    if (d[kategorie].rueckbau < 0) {
                        y = scale(d[kategorie].rueckbau) - scale(0) + scale(Math.abs(d[kategorie].rueckbau));
                    } else {
                        y = scale(d[kategorie].rueckbau);
                    }

                } else {
                    y = d[kategorie].rueckbau < 0 ? scale(negPart) : scale(posPart) - scale(0) + scale(d[kategorie].rueckbau);
                }
                return "translate(" + x + ", " + y + ")";
            })
            .style("fill", function (d) {
                return "grey";
            }).on("click",cyclePhase == "rueckbau" ? function(){update(data, "all")} : function(){update(data, "rueckbau")});


        svg.select("#ds456zeroline").remove();

        //create zero line
        svg.append('line')
            .attr("id", "ds456zeroline")
            .attr("stroke-width", 1)
            .attr("stroke", "grey")
            .attr('y1', scale(0))
            .attr('y2', scale(0))
            .attr('x1', marginLeft)
            .attr('x2', width);

        addTooltips(d3.selectAll(".ds456variante"))
    };

    this.update(data, "all");
}

function setTooltipContent(div, data, event) {
    var herstellung = data.herstellung;
    var nutzung = data.nutzung;
    var rueckbau = data.rueckbau;
    var target = event.srcElement.classList[0];
    div.html(
        "<span class='" + (target == "ds456rect_herstellung" ? "ds456target" : target) + "'><span>Herstellung:</span><span class='ds456tooltip_value'>" + format(Math.round(data.herstellung)) + "</span></span></br>" +
        "<span class='" + (target == "ds456rect_nutzung" ? "ds456target" : target) + "'><span>Nutzung:</span><span class='ds456tooltip_value'" + ">" + format(Math.round(data.nutzung)) + "</span></span></br>" +
        "<span class='" + (target == "ds456rect_rueckbau" ? "ds456target" : target) + "'><span>Rückbau:</span><span class='ds456tooltip_value'>" + format(Math.round(data.rueckbau)) + "</span></span><hr>" +
        "<span><span>Gesamt:</span><span class='ds456tooltip_value'>" + format(Math.round(herstellung + nutzung + rueckbau)) + "</span></span>")
}

function addTooltips(varianten) {

    var div = d3.select("body .ds456tooltip");

    //add tooltip (one for all)
    if (div.empty()) {
        div = d3.select("body").append("div")
            .attr("class", "ds456tooltip")
            .style("opacity", 0);
    }

    varianten.on("mouseover", function (d) {
        setTooltipContent(div, d[this.attributes.kategorie.nodeValue], d3.event);
        setTooltipPosition(div, d3.event);
        //make tooltip appear
        div.transition()
            .duration(300)
            .style("opacity", 1);

    varianten.on("mousemove", function(d){
        setTooltipContent(div, d[this.attributes.kategorie.nodeValue], d3.event);
        setTooltipPosition(div, d3.event);
        div.style("opacity", 1);
    });

    }).on("mouseout", function (d) {
        //make tooltip disappear
        div.transition()
            .duration(300)
            .style("opacity", 0)
    });
}

function setTooltipPosition(div, event) {
    div.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px");
}

function LineChart(data, containerId, kategorie, title, unit) {
    var width = 500;
    var height = 300;
    var marginLeft = 90;
    var marginBottom = 20;
    var barWidth = 45;
    var barDistance = 10;

    var charTitle = document.createElement("span");
    charTitle.setAttribute("class", "ds456charttitle");
    charTitle.innerHTML = title + "<span style='font-size:10px'>[" + unit +"]</span>";
    document.getElementById(containerId).appendChild(charTitle);

    //create svg
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis
    svg.append("g")
        .attr("transform", "translate(" + marginLeft + ", " + 0 + ")")
        .attr("id", "ds456yAxis" + containerId).style("font-size", "13px");;

    svg.append("g")
        .attr("transform", "translate(0, " + (height - marginBottom) + ")")
        .attr("id", "ds456xAxis" + containerId);

    this.update = function update(data) {

        var max_Value = 0;
        data.forEach(function (variante) {
            var p1 = variante[kategorie][0].y;
            var p2 = variante[kategorie][1].y;
            var p3 = variante[kategorie][2].y;
            if (Math.max(p1,p2,p3) > max_Value) {
                max_Value = Math.max(p1,p2,p3);
            }
        });

        var yScale = d3.scaleLinear().domain([0, max_Value]).range([height - marginBottom, 20]);

        //create axis and set tick-format
        var yAxis = d3.axisLeft(yScale).tickFormat(format);
        d3.select("#ds456yAxis" + containerId).call(yAxis);

        var xScale = d3.scaleLinear().domain([2017, 2049]).range([marginLeft, width-5]);

        svg.selectAll(".ds456lineChartPoint").remove();
        //create axis and set tick-format
        var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        d3.select("#ds456xAxis" + containerId).call(xAxis);

        //bind data
        var varianten = svg.selectAll(".ds456variante")
            .data(data, function (d) {
                return d.name
            });

        //exit
        //-------------------------------------------------
        varianten.exit().remove();

        //enter
        //-------------------------------------------------

        //add groups for varianten
        var new_varianten = varianten.enter()
            .append("g")
            .attr("class", "ds456variante")
            .attr("kategorie", kategorie);

        new_varianten.append("path").attr("class", "ds456verlauf");

        var line = d3.line()
            .x(function(d) { return xScale(d['x']); })
            .y(function(d) { return yScale(d['y']); });

        new_varianten.merge(varianten).select(".ds456verlauf")
            .attr("d", function(d,i) {
                var parent = d3.select(this.parentNode);
                d[kategorie].forEach(function(p){
                    parent.append("circle")
                        .attr("class","ds456lineChartPoint")
                        .attr("jahr", p['x'])
                        .attr("wert", p['y'])
                        .attr("cx", xScale(p['x']))
                        .attr("cy", yScale(p['y'])).attr("r",3)
                        .attr("fill", colors[i])
                });
                return line(d[kategorie]); })
            .attr("fill", "none")
            .attr("stroke", function(d,i){ return colors[i]})
            .attr("stroke-width", 3);

        addLineChartTooltips(d3.selectAll(".ds456lineChartPoint"))

    };
    this.update(data);

}

function addLineChartTooltips(points) {

    var div = d3.select("body .ds456tooltip2");

    //add tooltip (one for all)
    if (div.empty()) {
        div = d3.select("body").append("div")
            .attr("class", "ds456tooltip2")
            .style("opacity", 0);
    }

    var body_padding = parseFloat(d3.select("body").style("padding-left"));

    points.on("mouseover", function (d, index, array) {
        div.html("<div class='ds456tooltip2Column'><span>Jahr:</span><span>Wert:</span></div>" +
            "<div class='ds456tooltip2Column'><span class='ds456tooltip2_value'>" + array[index].attributes.jahr.value + "</span>" +
            "<span class='ds456tooltip2_value'>" + format(Math.round(array[index].attributes.wert.value)) + "</span>" +
            "</div>")
            .style("left", d3.event.pageX + 10 + "px")
            .style("top", d3.event.pageY + 10 + "px");
        //make tooltip appear
        div.transition()
            .duration(300)
            .style("opacity", 1);

    }).on("mouseout", function (d) {
        //make tooltip disappear
        div.transition()
            .duration(300)
            .style("opacity", 0)
    });
}

function showInfo(text,color) {
    var info = document.getElementById("ds456info");
    info.innerHTML = text;
    info.style.visibility = "visible";
    info.style.backgroundColor = color;
    setTimeout(function () {
        info.style.visibility = "hidden"
    }, 2000);
}