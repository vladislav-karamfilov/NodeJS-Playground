'use strict';

var EOL = require('os').EOL;
var STRING_TYPE_NAME = typeof '';

function DirectedGraph() {
  this._graph = {};
}

DirectedGraph.prototype = function () {
  var _validateNode = function _validateNode(node, paramName) {
    if (typeof node !== STRING_TYPE_NAME) {
      throw {message: paramName + ' must be string!'};
    }

    if (!node.trim()) {
      throw {message: paramName + ' not provided!'};
    }
  };

  var addEdge = function addEdge(nodeA, nodeB) {
    _validateNode(nodeA, 'nodeA');
    _validateNode(nodeB, 'nodeB');

    nodeA = nodeA.trim();
    nodeB = nodeB.trim();

    this._graph[nodeA] = this._graph[nodeA] || [];
    this._graph[nodeB] = this._graph[nodeB] || [];

    if (this._graph[nodeA].indexOf(nodeB) < 0) {
      this._graph[nodeA].push(nodeB);
    }
  };

  var getNeighbors = function getNeighbors(node) {
    _validateNode(node, 'node');

    node = node.trim();

    if (!this._graph[node]) {
      throw {message: 'No node "' + node + '" in the graph!'};
    }

    return this._graph[node];
  };

  var pathBetween = function pathBetween(nodeA, nodeB) {
    _validateNode(nodeA, 'nodeA');
    _validateNode(nodeB, 'nodeB');

    nodeA = nodeA.trim();
    nodeB = nodeB.trim();

    if (!this._graph[nodeA]) {
      throw {message: 'There is no node "' + nodeA + '" in the graph!'};
    }

    if (!this._graph[nodeB]) {
      throw {message: 'There is no node "' + nodeB + '" in the graph!'};
    }

    var traversed = {};
    var nodes = [];
    nodes.push(nodeA);

    while (nodes.length) {
      var currentNode = nodes.pop();
      traversed[currentNode] = true;

      var neighbors = this._graph[currentNode];
      for (var i = 0, neighborsCount = neighbors.length; i < neighborsCount; i++) {
        if (neighbors[i] === nodeB) {
          return true;
        }

        if (!traversed[neighbors[i]]) {
          nodes.push(neighbors[i]);
        }
      }
    }

    return false;
  };

  var toString = function toString() {
    var graph = this._graph;

    var result = '';

    Object.getOwnPropertyNames(graph).forEach(function (node) {
      result += node + ' -> { ';

      var neighborNodesCount = graph[node].length;
      graph[node].forEach(function (neighborNode, index) {
        result += neighborNode + (index < neighborNodesCount - 1 ? ', ' : ' ');
      });

      result += '}' + EOL;
    });

    return result.trim();
  };

  var getNodesCount = function getNodesCount() {
    return Object.getOwnPropertyNames(this._graph).length;
  };

  var getEdgesCount = function getEdgesCount() {
    var graph = this._graph;

    var edgesCount = 0;

    Object.getOwnPropertyNames(graph).forEach(function (node) {
      edgesCount += graph[node].length;
    });

    return edgesCount;
  };

  return {
    addEdge: addEdge,
    getNeighbors: getNeighbors,
    pathBetween: pathBetween,
    getNodesCount: getNodesCount,
    getEdgesCount: getEdgesCount,
    toString: toString
  };
}();

module.exports = DirectedGraph;
