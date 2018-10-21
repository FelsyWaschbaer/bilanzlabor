//define colours
var colorMap = {
    "Renaissance": "orchid",
    "Barock": "salmon",
    "Classic": "gold",
    "Romantic": "lightgreen",
    "Modern": "lightblue"
};

var rawData = null;
var kategorien = {penrt:{title:"PENRT [TJ]"}, gwp:{title:"GWP [t CO2-Eq]"}, ap:{title:"AP [kg SO2-Eq]"}, odp:{title:"ODP [kg CFC11-Eq]"}};

//load data
var resultMap = {};
var client = new XMLHttpRequest();
client.open('GET', "ecodata.txt");
client.addEventListener("load", function () {
    var lines = client.responseText.split("\n");
    lines.forEach(function (line) {
        line = line.replace(",", ".");
        var columns = line.split(";");
        var name = columns[5];
        var variante = {name: name};
        ;
        for (var i = 0; i <= 11; i = i + 3) {
            var herstellung = parseFloat(columns[i + 6]);
            var nutzung = parseFloat(columns[i + 7]);
            var rueckbau = parseFloat(columns[i + 8]);
            var kategorie = {herstellung: herstellung, nutzung: nutzung, rueckbau: rueckbau};
            variante[Object.keys(kategorien)[i / 3]] = kategorie;
        }
        resultMap[name] = variante;
    });
    document.querySelectorAll('input[name="wk"]').forEach(
        function (wk) {
            wk.addEventListener("change", onWirkungskategorienChanged);
        }
    );
    console.log(resultMap);
    var wks = getWirkungskategorien();
    onWirkungskategorienChanged();
});

client.send();

function onWirkungskategorienChanged() {
    var wks = getWirkungskategorien();
    var key1 = getKey(1);
    var chartContainer = document.getElementById("chartContainer");
    var chartIds = getPresentChartIds();
    console.log(chartIds);
    var charts = [];
    wks.forEach(function (wk, index) {
        if(!(chartIds.includes("chart" + wk))){
            var id = "chart" + wk;
            var container = document.createElement("div");
            container.setAttribute("id", id);
            container.setAttribute("class", "chart");
            chartContainer.appendChild(container);
            charts.push(new BarChart([resultMap[key1], resultMap["EnEV'16 As 3WSV_EPS_Gas_0.1"]], id, wk, kategorien[wk].title));
        }
    });
    var deletedElements = chartIds.filter(function(id){
       return !(wks.includes(id.slice(5)));
    });
    deletedElements.forEach(function(id){
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

function getPresentChartIds(){
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
    charts.forEach(function(chart){
        chart.update([resultMap[key1], resultMap["EnEV'16 As 3WSV_EPS_Gas_0.1"]])
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

function getKey(value) {
    var standard = getRadioValue("Standard" + value);
    var tga = getRadioValue("TGA" + value);
    var fenster = getRadioValue("Fenster" + value);
    var waermedaemmung = getRadioValue("Waermedaemmung" + value);
    var waermebruecken = getRadioValue("Waermebruecken" + value);
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
    var marginLeft = 100;
    var marginBottom = 20;
    var barWidth = 30;
    var barDistance = 5

    //create svg
    var svg = d3.select("#" + containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis
    svg.append("g")
        .attr("transform", "translate(" + marginLeft + ", " + 0 + ")")
        .attr("id", "axis" + containerId);

    svg.append("text").text(title).attr("transform", "translate(" + (marginLeft + barDistance) + ", " + (height-5) + ")");

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
        var axis = d3.axisLeft(scale);

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
            .attr("class", "variante");

        //add rectangle to composer
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
                var x = marginLeft + (i + 1) * (barWidth + barDistance);
                var y = yHerstellung(d[kategorie].herstellung);
                return "translate(" + x + ", " + y + ")";
            })
            .style("fill", function (d) {
                return "lightblue";
            })
            .transition().duration(0)
            .attr("height", function (d) {
                return scale(0) - scale(Math.abs(d[kategorie].herstellung))
            });

        new_varianten.merge(varianten).select(".rect_nutzung")
            .attr("width", barWidth)
            .style("fill", function (d) {
                return "orange";
            })
            .transition().duration(0)
            .attr("transform", function (d, i) {
                var x = marginLeft + (i + 1) * (barWidth + barDistance);
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
                var x = marginLeft + (i + 1) * (barWidth + barDistance);
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

    };

    this.update(data);
}


function ComposerChart(data) {

    var width = 1400;
    var height = 600;
    var margin = 20;

    //create svg
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    //add axis at the bottom of the svg
    svg.append("g")
        .attr("transform", "translate(0, " + (height - margin) + ")")
        .attr("id", "axis");

    this.update = function update(data) {

        var rectHeight = 17;
        var rectDistance = 38;
        var fontSize = 11;

        //sort data according to birthdate
        data.sort(function (composer1, composer2) {
            return composer1.yearBirth - composer2.yearBirth;
        });

        var min_yearBirth = data.length != 0 ? data[0].yearBirth : 0;

        var max_yearDeath = 0;
        data.forEach(function (composer) {
            if (composer.yearDeath > max_yearDeath) {
                max_yearDeath = composer.yearDeath;
            }
        });

        //create linear scale for axis and correct positioning of composers
        var scale = d3.scaleLinear()
            .domain([min_yearBirth - 20, max_yearDeath + 20])
            .range([0, width]);

        //create axis and set tick-format
        var axis = d3.axisBottom(scale).tickFormat(d3.format(".0f"));

        d3.select("#axis").transition().duration(500).call(axis);

        //bind data
        var composers = svg.selectAll(".composer")
            .data(data, function (d) {
                return d.name
            });

        //exit
        //-------------------------------------------------
        composers.exit().remove();

        //enter
        //-------------------------------------------------

        //add groups for composers
        var new_composers = composers.enter()
            .append("g")
            .attr("class", "composer");

        //add rectangle to composer
        new_composers.append("rect");

        new_composers.append("text")
            .text(function (d) {
                var nameArray = d.name.split(" ");
                var name = "";
                for (var i = 0; i < nameArray.length - 1; i++) {
                    name += nameArray[i].slice(0, 1) + ". ";
                }
                name += nameArray[nameArray.length - 1];
                return name;
            })
            .attr("y", function (d, i) {
                return rectHeight / 2 + fontSize / 2;
            })
            .attr("x", function (d) {
                return 3;
            })
            .style("font-size", fontSize + "px");

        //update (all)
        //--------------------------------------------------------------------
        new_composers.merge(composers).select("rect")
            .attr("width", function (d) {
                return scale(d.yearDeath) - scale(d.yearBirth)
            })
            .attr("height", rectHeight)
            .style("fill", function (d) {
                return colorMap[d.period]
            });

        new_composers.merge(composers)
            .transition().duration(500)
            .attr("transform", function (d, i) {
                var itemsPerColumn = Math.round((height - 3 * margin - 0.5 * rectDistance) / rectDistance);
                var x = (scale(d.yearBirth));
                var y = (rectDistance * (i % itemsPerColumn) + (((i / itemsPerColumn) % 2) * 0.5 * rectDistance));
                return "translate(" + x + ", " + y + ")";
            });


        addTooltips(d3.selectAll(".composer"));
    };

    this.legende = new Legende(svg, data, this, height);
    this.update(data);

}

function addTooltips(composers) {

    var div = d3.select("body .tooltip");

    //add tooltip (one for all)
    if (div.empty()) {
        div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    var body_padding = parseFloat(d3.select("body").style("padding-left"));

    composers.on("mouseover", function (d, index, array) {

        div.html(d.name + "<br/>" + d.yearBirth + "-" + d.yearDeath)
            .style("left", body_padding + array[index].transform.animVal[0].matrix.e + "px")
            .style("top", (array[index].transform.animVal[0].matrix.f - 0) + "px");
        //make tooltip appear
        div.transition()
            .duration(100)
            .style("opacity", 1);


    }).on("mouseout", function (d) {
        //make tooltip disappear
        div.transition()
            .duration(100)
            .style("opacity", 0)
    });
}


function Legende(svg, data, chart, chartHeight) {
    var svg = svg;
    var rawData = data;
    var legend_height = 200;
    var margin = 25;
    var fontSize = 10;

    var currentData = data;

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (margin) + ", " + (chartHeight - legend_height - 3 * margin) + ")");

    legend.append("rect")
        .attr("width", 150)
        .attr("height", legend_height)
        .attr("rx", 5)
        .attr("ry", 5);

    var colorArray = [];
    var activityMap = {};
    for (var key in colorMap) {
        activityMap[key] = true;
        colorArray.push({key: key, color: colorMap[key]});
    }
    var legendItems = legend.selectAll(".legendItem")
        .data(colorArray)
        .enter()
        .append("circle")
        .attr("class", "legendItem")
        .attr("cy", function (d, i) {
            return i * 35 + margin
        })
        .attr("cx", margin)
        .attr("r", 7)
        .style("fill", function (d) {
            return d.color
        })

        //add functionality
        .on("click", function (d) {
            var resultData = [];
            if (activityMap[d.key]) {
                activityMap[d.key] = false;
                d3.select(this).style("stroke", d.color)
                    .style("fill", "white");
                currentData.forEach(function (composer) {
                    if (composer.period != d.key) {
                        resultData.push(composer);
                    }
                });
            } else {
                activityMap[d.key] = true;
                d3.select(this).style("fill", d.color)
                    .style("stroke", "white");
                var resultData = currentData;
                rawData.forEach(function (composer) {
                    if (composer.period == d.key) {
                        resultData.push(composer);
                    }
                });
            }
            currentData = resultData;
            chart.update(resultData);
        });

    var legendTexts = legend.selectAll(".legendText")
        .data(colorArray)
        .enter()
        .append("text")
        .attr("class", "legendText")
        .text(function (d) {
            return d.key
        })
        .attr("y", function (d, i) {
            return i * 35 + margin + fontSize / 2.0
        })
        .attr("x", 2 * margin)
        .style("font-size", fontSize + "px")
}