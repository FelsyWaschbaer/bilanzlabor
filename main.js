var rawData = null;
var kategorien = {
    penrt: {title: "PENRT [TJ]"},
    gwp: {title: "GWP [t CO2-Eq]"},
    ap: {title: "AP [kg SO2-Eq]"},
    odp: {title: "ODP [kg CFC11-Eq]"}
};
var stellschrauben = {
    energiestandard: {options: ["EnEV'16", "KfW70", "KfW55"]},
    tga: {options: ["Gas", "WP", "Pellets"]},
    fenster: {options: ["FB", "2WSV", "3WSV"]},
    waermedaemmung: {options: ["EPS", "Holz", "HFMW"]},
    waermebruecken: {options: ["0.1", "0.05"]}
};



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
client.open('GET', "ecodata.txt");
client2.open('GET', "lineChartData.txt");
client.addEventListener("load", function () {
    var lines = client.responseText.split("\n");
    lines.forEach(function (line) {
        line = line.replace(",", ".");
        var columns = line.split(";");
        var name = columns[5];
        var variante = {name: name};

        for (var i = 0; i <= 11; i = i + 3) {
            var herstellung = parseFloat(columns[i + 6]);
            var nutzung = parseFloat(columns[i + 7]);
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
    // printMissingVariants(resultMap);
    // onWirkungskategorienChanged();
});

client2.addEventListener("load", function() {
    var lines = client2.responseText.split("\n");
    lines.forEach(function (line) {
        line = line.replace(",", ".");
        var columns = line.split(";");
        var name = columns[0];
        var p1_penrt = {x: 2017, y: parseFloat(columns[1])};
        var p2_penrt = {x: 2046, y: parseFloat(columns[1]) + 29 * parseFloat(columns[2])};
        var p3_penrt = {x: 2047, y: parseFloat(columns[3])};
        var p1_gwp = {x: 2017, y: parseFloat(columns[4])};
        var p2_gwp = {x: 2046, y: parseFloat(columns[4]) + 29 * parseFloat(columns[5])};
        var p3_gwp = {x: 2047, y: parseFloat(columns[6])};
        lineChartMap[name] = {name: name, penrt: [p1_penrt, p2_penrt, p3_penrt], gwp: [p1_gwp, p2_gwp, p3_gwp]};
    });
    console.log(lineChartMap);
    var data = [];
    Object.keys(lineChartMap).forEach(function(key) {
       data.push(lineChartMap[key]);
    });
    var chartContainer = document.getElementById("chartContainer");
    var id = "chart" + "penrt";
    var container = document.createElement("div");
    container.setAttribute("id", id);
    container.setAttribute("class", "chart");
    chartContainer.appendChild(container);
    var key1 = getKey(1);
    var key2 = getKey(2);
    var variante1 = resultMap[key1] != undefined ? resultMap[key1] : new Variante2();
    var variante2 = resultMap[key2] != undefined ? resultMap[key2] : new Variante2();
    remainingAsyncCalls--;
    if(remainingAsyncCalls == 0){
        showDiagramms();
    }
});

client.send();
client2.send();

function showDiagramms() {
    document.getElementById("loader").style.display = "none";
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
    document.getElementById("legendeContainer").style.opacity = opacity;
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
    var chartContainer = document.getElementById("chartContainer");
    var chartIds = getPresentChartIds();
    console.log(chartIds);
    var charts = [];
    wks.forEach(function (wk, index) {
        if (!(chartIds.includes("chart" + wk))) {
            var id = "chart" + wk;
            var container = document.createElement("div");
            container.setAttribute("id", id);
            container.setAttribute("class", "chart");
            chartContainer.appendChild(container);
            if(chartType == "barchart"){
                charts.push(new BarChart([variante1, variante2], id, wk, kategorien[wk].title));
            }else{
                charts.push(new LineChart([variante1, variante2], id, wk, kategorien[wk].title));
            }

        }
    });
    var deletedElements = chartIds.filter(function (id) {
        return !(wks.includes(id.slice(5)));
    });
    deletedElements.forEach(function (id) {
        var element = document.getElementById(id);
        element.parentNode.removeChild(element);
    });
    console.log("DE: " + deletedElements);
    document.querySelectorAll('.radiogroup2 input').forEach(
        function (radiobutton) {
            radiobutton.addEventListener("click", function () {
                onSelected(charts);
            });
        }
    )
}

function getPresentChartIds() {
    result = [];
    document.querySelectorAll(".chart").forEach(
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
        chart.update([variante1, variante2]);
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
    if (standard !== "EnEV'16" && fenster !== "3WSV") {
        showInfo("Der Energiestandard ist nur mit dreifach verglasten Fenstern zu erreichen");
    }
    return [standard, fenster, waermedaemmung, tga, waermebruecken].join("_");
}

function posF(value) {
    return value > 0 ? value : 0;
}

function negF(value) {
    return value < 0 ? value : 0;
}

function BarChart(data, containerId, kategorie, title) {

    var width = 250;
    var height = 300;
    var marginLeft = 90;
    var marginBottom = 20;
    var barMarginLeft = 20;
    var barWidth = 45;
    var barDistance = 10;

    //create svg
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis
    svg.append("g")
        .attr("transform", "translate(" + marginLeft + ", " + 0 + ")")
        .attr("id", "axis" + containerId);

    svg.append("text").text(title).attr("transform", "translate(" + (marginLeft + barDistance) + ", 10)");

    svg.append("circle")
        .attr("r", 5)
        .attr("fill", "blue")
        .attr("cx", marginLeft + barMarginLeft + barWidth / 2)
        .attr("cy", height - 10);
    svg.append("circle")
        .attr("r", 5)
        .attr("fill", "red")
        .attr("cx", marginLeft + barMarginLeft + barDistance + 1.5 * barWidth)
        .attr("cy", height - 10);

    this.update = function update(data) {
        //data = [{kategorie:{herstellung: 10000000, nutzung:-10000000, rueckbau: -5000000}}, data[1]];;
        var max_Value = 0;
        var min_Value = 0;
        data.forEach(function (variante) {
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
        var axis = d3.axisLeft(scale).ticks(5);

        d3.select("#axis" + containerId).call(axis);

        //bind data
        var varianten = svg.selectAll(".variante")
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
            .attr("class", "variante")
            .attr("kategorie", kategorie);

        new_varianten.append("rect").attr("class", "rect_herstellung");
        new_varianten.append("rect").attr("class", "rect_nutzung");
        new_varianten.append("rect").attr("class", "rect_rueckbau");

        //update (all)
        //--------------------------------------------------------------------
        function yHerstellung(value) {
            if (value > 0) {
                return scale(value);
            } else {
                return scale(value) - scale(0) + scale(Math.abs(value));
            }

        }

        new_varianten.merge(varianten).select(".rect_herstellung")
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
            });

        new_varianten.merge(varianten).select(".rect_nutzung")
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
            });

        new_varianten.merge(varianten).select(".rect_rueckbau")
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
            });


        svg.select("#zeroline").remove();

        //create zero line
        svg.append('line')
            .attr("id", "zeroline")
            .attr("stroke-width", 1)
            .attr("stroke", "grey")
            .attr('y1', scale(0))
            .attr('y2', scale(0))
            .attr('x1', marginLeft)
            .attr('x2', width);

        addTooltips(d3.selectAll(".variante"))
    };

    this.update(data);
}

function addTooltips(varianten) {

    var div = d3.select("body .tooltip");

    //add tooltip (one for all)
    if (div.empty()) {
        div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    var body_padding = parseFloat(d3.select("body").style("padding-left"));

    varianten.on("mouseover", function (d, index, array) {
        var herstellung = d[this.attributes.kategorie.nodeValue].herstellung;
        var nutzung = d[this.attributes.kategorie.nodeValue].nutzung;
        var rueckbau = d[this.attributes.kategorie.nodeValue].rueckbau;
        div.html("Herstellung:" + d[this.attributes.kategorie.nodeValue].herstellung + "</br>" +
            "Nutzung:" + d[this.attributes.kategorie.nodeValue].nutzung + "</br>" +
            "Rückbau:" + d[this.attributes.kategorie.nodeValue].rueckbau + "<hr>" +
            "Gesamt:" + (herstellung + nutzung + rueckbau))
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY + "px");
        //make tooltip appear
        div.transition()
            .duration(300)
            .style("opacity", 1);

    varianten.on("mousemove", function(d){
        div.style("left", d3.event.pageX + "px").style("top", d3.event.pageY + "px");
    });

    }).on("mouseout", function (d) {
        //make tooltip disappear
        div.transition()
            .duration(300)
            .style("opacity", 0)
    });
}

function LineChart(data, containerId, kategorie, title) {
    var width = 500;
    var height = 300;
    var marginLeft = 90;
    var marginBottom = 20;
    var barMarginLeft = 20;
    var barWidth = 45;
    var barDistance = 10;

    //create svg
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis
    svg.append("g")
        .attr("transform", "translate(" + marginLeft + ", " + 0 + ")")
        .attr("id", "yAxis" + containerId);

    svg.append("g")
        .attr("transform", "translate(0, " + (height - marginBottom) + ")")
        .attr("id", "xAxis" + containerId);


    svg.append("text").text(title).attr("transform", "translate(" + (marginLeft) + ",10)");

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
        var yAxis = d3.axisLeft(yScale);
        d3.select("#yAxis" + containerId).call(yAxis);

        var xScale = d3.scaleLinear().domain([2017, 2047]).range([marginLeft, width]);

        //create axis and set tick-format
        var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        d3.select("#xAxis" + containerId).call(xAxis);

        //bind data
        var varianten = svg.selectAll(".variante")
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
            .attr("class", "variante")
            .attr("kategorie", kategorie);


        new_varianten.append("path").attr("class", "verlauf");

        var line = d3.line()
            .x(function(d) { return xScale(d['x']); })
            .y(function(d) { return yScale(d['y']); });

        colors = ["lightblue", "red"];

        new_varianten.merge(varianten).select(".verlauf")
            .attr("d", function(d) { return line(d[kategorie]); })
            .attr("fill", "none")
            .attr("stroke", function(d,i){ return colors[i]})
            .attr("stroke-width", 3);

        console.log(xScale(2017));
    };
    this.update(data);

}

function showInfo(text) {
    var info = document.getElementById("info");
    info.innerHTML = text;
    info.style.visibility = "visible";
    setTimeout(function () {
        info.style.visibility = "hidden"
    }, 2000);
}