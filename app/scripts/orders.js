(function () {
    'use strict';
    /* global _, foodit */
    foodit.orders = {

        Order: foodit.Model.extend({
            idAttribute: 'orderId'
        }),

        Collection: foodit.Collection.extend({
            initialize: function(options) {
                this.id = options.restaurant;
            },
            urlRoot: '/data/orders-',
            url: function () {
                return this.urlRoot + this.id + '.json'
            },
            sortDirection: 1,
            sortProperty: '',
            strategies: {
                Date: function (order) { return this.sortDirection * new Date(order.get('created')); },
                Total: function (order) { return this.sortDirection * order.get('totalValue'); }
            },
            changeSort: function (sortProperty) {
                var strategy = this.strategies[sortProperty];
                if (strategy !== undefined) {
                    this.sortDirection = strategy === this.comparator ? this.sortDirection * -1 : 1;
                    this.sortProperty = sortProperty;
                    this.comparator = strategy;
                    this.sort();
                    return true;
                }
            }
        }),

        ContainerView: foodit.View.extend({
            template: _.template($('#t-order-container').html()),
            initialize: function () {
                this.orderView = new foodit.orders.OrderView;
                this.restaurantSelect = new foodit.restaurants.SelectView;
                this.listenTo(this.restaurantSelect, 'change:restaurant', function (restaurantId) {
                    var _this = this;
                    this.orderView.collection = new foodit.orders.Collection({restaurant: restaurantId});
                    this.orderView.collection.fetch({
                        error: function () {
                            console.error('failed to fetch orders :(')
                        },
                        success: function () {
                            _this.orderView.render()
                        }
                    });
                })
            },
            render: function () {
                this.$el.html(this.template());
                this.restaurantSelect.render();
                this.orderView.render();
                this.$el.find('#restaurants-select-group').append(this.restaurantSelect.el);
                this.$el.append(this.orderView.el);
                return this;
            },
            events: {
                'click th': 'headerClick'
            },
            headerClick: function( e ) {
                var $el = $(e.currentTarget);
                var success = this.orderView.collection.changeSort($el.text());

                if (success === true) {
                    this.orderView.render();
                }
            }
        }),

        OrderView: foodit.View.extend({
            template: _.template($('#t-orders').html()),
            render: function () {
                this.$el.html(this.template({orders: this.collection ? this.collection.toJSON() : null}))

                if (this.collection !== undefined && this.collection.sortProperty !== '') {
                    this.$el.find('th:contains(' + this.collection.sortProperty + ')')
                        .addClass(this.collection.sortDirection === 1 ? 'sorted-column-asc' : 'sorted-column-desc');
                }
            }
        })

    }
    foodit.router.route('orders', 'orders', function () {
        this.setView(new foodit.orders.ContainerView)
    })
})()
