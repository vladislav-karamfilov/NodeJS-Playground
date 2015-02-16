'use strict';

var EOL = require('os').EOL;

var Graph = require('../lib/directed-graph.js');
var expect = require('chai').expect;

describe('Graph', function () {
  describe('addEdge', function () {
    var graph;
    beforeEach(function () {
      graph = new Graph();
    });

    it('should throw for object nodeA parameter', function () {
      expect(function () {
        graph.addEdge({test: 'test'}, 'b');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should throw for object nodeB parameter', function () {
      expect(function () {
        graph.addEdge('a', {test: 'test'});
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should throw for empty nodeA parameter', function () {
      expect(function () {
        graph.addEdge('', 'b');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should throw for empty nodeB parameter', function () {
      expect(function () {
        graph.addEdge('a', '');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should throw for null nodeA parameter', function () {
      expect(function () {
        graph.addEdge(null, 'b');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should throw for null nodeB parameter', function () {
      expect(function () {
        graph.addEdge('a', null);
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should have two nodes after one addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getNodesCount()).to.equal(2);
    });

    it('should have one edge after one addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getEdgesCount()).to.equal(1);
    });

    it('should have two nodes after more than one addition of the same edge', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');

      expect(graph.getNodesCount()).to.equal(2);
    });

    it('should have one edge after more than one addition of the same edge', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');

      expect(graph.getEdgesCount()).to.equal(1);
    });

    it('should have 2 * n nodes after n additions of different edges', function () {
      var n = 3;
      for (var i = 0; i < n; i++) {
        graph.addEdge('a' + i, 'b' + i);
      }

      expect(graph.getNodesCount()).to.equal(2 * n);
    });

    it('should have n edges after n additions of different edges', function () {
      var n = 3;
      for (var i = 0; i < n; i++) {
        graph.addEdge('a' + i, 'b' + i);
      }

      expect(graph.getEdgesCount()).to.equal(n);
    });

    it('should have one edge after adding nodes with whitespace in the names', function () {
      graph.addEdge(' a    ', '    b   ');

      expect(graph.getEdgesCount()).to.equal(1);
    });
  });

  describe('getNeighbors', function () {
    var graph;
    beforeEach(function () {
      graph = new Graph();
    });

    it('should throw for not existing node in the graph', function () {
      graph.addEdge('a', 'b');

      expect(function () {
        graph.getNeighbors('c');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should have one neighbor after a single addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('a').length).to.equal(1);
    });

    it('should have one neighbor after duplicated edge addition', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('a').length).to.equal(1);
    });

    it('should have zero neighbors after a single addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('b').length).to.equal(0);
    });

    it('should have the correct neighbor after a single addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('a')).to.deep.equal(['b']);
    });

    it('should have the correct neighbor after duplicated edge addition', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('a')).to.deep.equal(['b']);
    });

    it('should have not neighbors after a single addition of edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.getNeighbors('b')).to.deep.equal([]);
    });

    it('should have the correct neighbors after multiple additions of edges', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('b', 'a');
      graph.addEdge('a', 'c');
      graph.addEdge('a', 'd');
      graph.addEdge('d', 'a');

      expect(graph.getNeighbors('a')).to.deep.equal(['b', 'c', 'd']);
    });
  });

  describe('pathBetween', function () {
    var graph;

    beforeEach(function () {
      graph = new Graph();
    });

    it('should throw when one/both of the nodes are not in the graph', function () {
      graph.addEdge('a', 'b');

      expect(function () {
        graph.pathBetween('c', 'd');
      })
        .to.throw(Object)
        .and.to.have.ownProperty('message');
    });

    it('should have path between nodes for graph with single edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.pathBetween('a', 'b')).to.be.true;
    });

    it('should not have path between nodes for graph with single edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.pathBetween('b', 'a')).to.be.false;
    });

    it('should not have path between nodes for graph with multiple edges', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('b', 'c');
      graph.addEdge('a', 'd');
      graph.addEdge('d', 'b');

      expect(graph.pathBetween('a', 'c')).to.be.true;
    });
  });

  describe('toString', function () {
    var graph;

    beforeEach(function () {
      graph = new Graph();
    });

    it('should be empty string for empty graph', function () {
      expect(graph.toString()).to.equal('');
    });

    it('should be correct string for graph with one edge', function () {
      graph.addEdge('a', 'b');

      expect(graph.toString()).to.equal('a -> { b }' + EOL + 'b -> { }');
    });

    it('should be correct string for graph with multiple edge', function () {
      graph.addEdge('a', 'b');
      graph.addEdge('b', 'c');
      graph.addEdge('a', 'd');
      graph.addEdge('d', 'b');

      expect(graph.toString()).to.equal(
        'a -> { b, d }' + EOL + 'b -> { c }' + EOL + 'c -> { }' + EOL + 'd -> { b }');
    });
  });
});
