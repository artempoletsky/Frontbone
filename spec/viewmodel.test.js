/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable, spyOn*/
describe('ViewModel', function () {
    "use strict";

    it('can parse options object', function () {

        var simpleRawOptions = '   {\n\
         model: Task,\n\
         add: todos | Math.floor(todos.length/2),\n\
         foo: bar\n\
         }\n\
         ';
        var simpleOptions = ViewModel.parseOptionsObject(simpleRawOptions);

        expect(simpleOptions.model).toBe('Task');
        expect(simpleOptions.add).toBe('todos | Math.floor(todos.length/2)');
        expect(simpleOptions.foo).toBe('bar');

        var rawOptions = '   {\n\
            model: Task,\n\
            b: {c: d},\
            submit: {\n\
                add: todos | Math.floor(todos.length/2),\n\
                foo: {\n\
                    bar: a,\n\
                    baz: sdfsdf\n\
                }\n\
            }\n\
        }\n\
           ';

        var options = ViewModel.parseOptionsObject(rawOptions);
        expect(options.model).toBe('Task');
        expect(options.submit.add).toBe('todos | Math.floor(todos.length/2)');
        expect(options.submit.foo.bar).toBe('a');
        expect(options.submit.foo.baz).toBe('sdfsdf');
        expect(options.b.c).toBe('d');
    });
    it('can create VM object', function () {
        var click = jasmine.createSpy('click');
        var vm;
        var obj = {
            el: 'div',
            initialize: function () {},
            events: {
                'click': 'onClick'
            },
            onClick: click
        };
        spyOn(obj, 'initialize');
        vm = ViewModel.create(obj);
        expect(obj.initialize.calls[0].object).toBe(vm);
        expect(obj.initialize).toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
        vm.el.fire('click');
        expect(click).toHaveBeenCalled();
    });


    it('context of \'delegateEvents\' handlers must be this ViewModel', function () {
        var called = false;
        var vm = ViewModel.create({
            el: 'body',
            events: {
                'click': 'onClick'
            },
            onClick: function () {
                called = true;
                expect(this).toBe(vm);
            }
        });
        expect(vm.events.click).toEqual('onClick');
        expect(called).toBe(false);
        //$('body').append(vm.$el);
        vm.el.fire('click');
        expect(called).toBe(true);
    });

    it('can delegate events', function () {
        var div = $.make('div');
        div.innerHTML = '<div id="grand"><div class="father"><div class="child"></div></div></div>';
        var dom = div.firstChild;
        var spy = jasmine.createSpy();
        var vm = ViewModel.create({
            el: dom,
            events: {
                'click .child': 'onClick'
            },
            onClick: spy
        });
        expect(spy.calls.length).toBe(0);
        vm.el.fire('click');
        expect(spy.calls.length).toBe(0);
        //vm.$el.find('.child').click();
        vm.$('.child').fire('click');
        expect(spy.calls.length).toBe(1, 'calls length');
        expect(spy.calls[0].args[0].type).toBe('click', 'event type');
        expect(spy.calls[0].object).toBe(vm, 'context check');
    });
    it('can undelegate events', function () {
        var dom = $.parse('<div id="grand"><div class="father"><div class="child"></div></div></div>');
        var spy = jasmine.createSpy();
        var vm = ViewModel.create({
            el: dom,
            events: {
                'click .child': 'onClick'
            },
            onClick: spy
        });
        var child = vm.el.$('.child');
        child.fire('click');
        expect(spy.calls.length).toBe(1);
        vm.undelegateEvents();
        child.fire('click');
        expect(spy.calls.length).toBe(1);
        vm.delegateEvents();
        child.fire('click');
        expect(spy.calls.length).toBe(2);
    });

    it('can provide additional arguments to event handlers', function () {

        var C = Collection.extend({
            model: {
                complete: false,
                name: ''
            }
        });

        var c = new C([{
            name: '1'
        }, {
            name: '2'
        }, {
            name: '3'
        }, {
            name: '4'
        }, {
            name: '5'
        }, ]);

        var label, li, i, m, input;

        var w = Widget.create({
            el: $.parse('<ul data-bind="each"><li><input data-bind="checked: complete"/><label data-bind="html: name"></label></li></ul>'),
            listItem: 'li',
            fields: {
                collection: c
            },
            events: {
                'click label': (me, e, delegate, listItem, index, model) => {
                    expect(me).toBe(w);
                    expect(delegate).toBe(label);
                    expect(listItem).toBe(li);
                    expect(index).toBe(i);
                    expect(model).toBe(m);
                },
                'click input': 'onInputClick'
            },
            onInputClick(e, delegate, listItem, index, model) {
                expect(this).toBe(w);
                expect(delegate).toBe(input);
                expect(listItem).toBe(li);
                expect(index).toBe(i);
                expect(model).toBe(m);
            }
        });
        i = 3;
        li = w.el.$$('li')[i];
        label = li.$('label');
        m = w.collection.at(i);
        expect(label.innerHTML).toBe('4');
        label.fire('click');
        input = li.$('input');
        input.fire('click');
    });


    xit('each method must return this', function () {
        var vm = new ViewModel();
        var exclude = 'on,initialize,hasListener,get,$,setElement,one,bindToModel,_constructor';
        var me;
        _.each(vm, function (prop) {
            if (typeof vm[prop] == 'function' && exclude.indexOf(prop) == -1) {
                try {
                    me = vm[prop]();
                } catch (exception) {
                    throw Error(prop + ' throw error ' + exception.message);
                }
                if (me !== vm) {
                    throw Error(prop + '() not return this');
                }
            }
        });

        me = vm.on('click', function () {});
        expect(me).toBe(vm);
        me = vm.one('click', function () {});
        expect(me).toBe(vm);
        me = vm.setElement(document.createElement('div'));
        expect(me).toBe(vm);
    });

    xit('observables has no _super', function () {
        var obs = Observable(' _super(); ');
        var vm = ViewModel.create({
            obs: obs
        });
        var called = 0;
        vm.obs.subscribe(function () {
            called++;
        });

        expect(vm.obs).toBe(obs);
        expect(called).toBe(0);
        vm.obs(1);
        expect(called).toBe(1);
    });

    it('has extended events behavior', function () {
        var spy1 = jasmine.createSpy('spy');
        var spy2 = jasmine.createSpy('spy');
        var spy3 = jasmine.createSpy('spy');
        var spy4 = jasmine.createSpy('spy');

        var element = $.make('div');
        element.innerHTML = '<div><div class="trigger"></div><div class="trigger1"></div></div>';

        var vm = ViewModel.create({
            events: {
                'event1 .trigger': spy1,
                'click,event2': spy2,
                'click,event2 .trigger,div .trigger1': spy3,
                'click,event2,event3': spy4
            },
            el: element
        });

        vm.$('.trigger').fire('event1');

        expect(spy1.calls.length).toBe(1, 'spy 1, assert1');
        expect(spy2.calls.length).toBe(0, 'spy 2, assert1');
        expect(spy3.calls.length).toBe(0, 'spy 3, assert1');
        expect(spy4.calls.length).toBe(0, 'spy 4, assert1');

        vm.el.fire('click');

        expect(spy1.calls.length).toBe(1, 'spy 1, assert2');
        expect(spy2.calls.length).toBe(1, 'spy 2, assert2');
        expect(spy3.calls.length).toBe(0, 'spy 3, assert2');
        expect(spy4.calls.length).toBe(1, 'spy 4, assert2');

        vm.$('.trigger1').fire('event2');

        expect(spy1.calls.length).toBe(1, 'spy 1, assert3');
        expect(spy2.calls.length).toBe(2, 'spy 2, assert3');
        expect(spy3.calls.length).toBe(1, 'spy 3, assert3');
        expect(spy4.calls.length).toBe(2, 'spy 4, assert3');


        vm.el.fire('event3');

        expect(spy1.calls.length).toBe(1, 'spy 1, assert4');
        expect(spy2.calls.length).toBe(2, 'spy 2, assert4');
        expect(spy3.calls.length).toBe(1, 'spy 3, assert4');
        expect(spy4.calls.length).toBe(3, 'spy 4, assert4');
    });


    it('parseOptionsObject', function () {

        //console.log(ViewModel.parseOptionsObject('a:b'));
        //console.log(ViewModel.parseOptionsObject('{a:b'));
        //ViewModel.parseOptionsObject('{}')
        expect(function () {
            ViewModel.parseOptionsObject('{ a : b }');
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{}');
        }).not.toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:b');
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('a:b');
        }).toThrow();
        expect(function () {
            ViewModel.parseOptionsObject('{a:}');
        }).not.toThrow();
        expect(ViewModel.parseOptionsObject('{a:b}').a).toBe('b');
        expect(ViewModel.parseOptionsObject('{asdvccbt:erwer}').asdvccbt).toBe('erwer');
        expect(ViewModel.parseOptionsObject('{\n\
											asdvccbt:\n\
											erwer\n\
											}').asdvccbt).toBe('erwer');
    });

    it('supports shortcuts', function () {
        let div = $.make('div');
        div.innerHTML = '<div class="foo"></div>';

        var view = ViewModel.create({
            el: div,
            shortcuts: {
                '$foo': '.foo'
            }
        });
        expect(view.$foo).toBe(div.$('.foo'));
    });

    it('can copy fields from model', function () {
        var Person = Model.extend({
            foo: 'bar'
        });
        var Hero = Person.extend({
            fields: {
                firstName: '',
                lastName: '',
                fullName(firstName, lastName) {
                    return firstName + ' ' + lastName;
                }
            }
        });
        var Test = ViewModel.extend({
            modelClass: Hero,
            autoParseBinds: true,
            fields: {
                reverseFullName(firstName, lastName) {
                    return lastName + ' ' + firstName;
                }
            }
        });
        var superman = new Hero({
            firstName: 'Clark',
            lastName: 'Kent'
        });

        expect(superman.foo).toBe('bar');

        var test = new Test({
            el: $.parse('<div data-bind="html: fullName"></div>'),
            model: superman
        });

        expect(Test.prototype.autoParseBinds).toBe(true);

        expect(superman.reverseFullName).toBeUndefined();

        expect(test.fullName).toBe('Clark Kent');

        expect(test.el.innerHTML).toBe('Clark Kent');

        var batman = new Hero({
            firstName: 'Bruce',
            lastName: 'Wayne'
        });

        expect(batman.reverseFullName).toBeUndefined();

        test.setModel(batman);

        expect(test.el.innerHTML).toBe('Bruce Wayne');
    });


    describe('findBinds', function () {
        it('can parse binds from html', function () {

            var div = $.make('div');
            div.setAttribute('data-bind', 'html: name');
            ViewModel.create({
                el: div,
                autoParseBinds: true,
                fields: {
                    name: 'Moe'
                }
            });
            expect(div.innerHTML).toBe('Moe');
        });

        it('has not strong binds syntax', function () {
            ViewModel.binds.foo = function (elem, value, context) {

            };
            ViewModel.binds.bar = function (elem, value, context) {

            };
            spyOn(ViewModel.binds, 'foo');
            spyOn(ViewModel.binds, 'bar');
            var el = $.parse('<div data-bind="foo"><div data-bind="bar: baz;"></div></div>');
            ViewModel.findBinds(el, window);
            expect(ViewModel.binds.foo.calls.length).toBe(1);
            expect(ViewModel.binds.foo.calls[0].args[1]).toBe('');
            expect(ViewModel.binds.foo.calls[0].args[2]).toBe(window);
            expect(ViewModel.binds.bar.calls.length).toBe(1);
            expect(ViewModel.binds.bar.calls[0].args[1]).toBe('baz');
            expect(ViewModel.binds.bar.calls[0].args[2]).toBe(window);
        });

        it('throws exeption when query returns zero length result', function () {
            expect(function () {
                ViewModel.findBinds('not_exists');
            }).toThrow(new Error("Element not exists"));
        });

        it('has optional parameters', function () {
            var spy = ViewModel.binds.spy = jasmine.createSpy()

            var div = $.parse('<div data-bind="spy"></div>');

            ViewModel.findBinds(div);
            expect(spy.calls.length).toBe(1);
            expect(spy.calls[0].object).toBe(ViewModel);
            expect(spy.calls[0].args[0]).toBe(div);
            expect(spy.calls[0].args[1]).toBe('');
            expect(spy.calls[0].args[2]).toBeUndefined();
            expect(spy.calls[0].args[3]).toBeUndefined();
        });

        it('supports value bind', function () {
            var vm = ViewModel.create({
                el: $.parse('<input data-bind="value: value"/>'),
                autoParseBinds: true,
                fields: {
                    value: 3
                }
            });
            expect(vm.value).toBe(3);
            expect(vm.el.value).toBe('3');
            vm.value = 10;
            expect(vm.el.value).toBe('10');

            vm.el.value = 50;

            vm.el.fire('change');

            expect(vm.value).toBe('50');
        });
    });


    describe('templates', function () {

        window.VM = ViewModel.extend({
            template: 'foo',
            autoParseBinds: true,
            fields: {
                value: ''
            }
        });

        it('supports templates', function () {
            ViewModel.templates.foo = $.parse('<div data-bind="html: value"></div>');


            let vm1 = new VM();


            expect(vm1.el.innerHTML).toBe('');
            vm1.value = 'foo';

            expect(vm1.el.innerHTML).toBe('foo');

            let vm2 = new VM();
            expect(vm2.el.innerHTML).toBe('');
            expect(vm1.el.innerHTML).toBe('foo');

            vm2.value = 'bar';
            expect(vm1.el.innerHTML).toBe('foo');
            expect(vm2.el.innerHTML).toBe('bar');
        });

        it('can take template from html', function(){
            ViewModel.findBinds($.parse('<template name="foo"><i data-bind="html: value"></i></template>'));
            let vm1 = new VM();
            vm1.value = 'foo';
            expect(vm1.el.tagName.toLowerCase()).toBe('i');
            expect(vm1.el.innerHTML).toBe('foo');
        });

        it('can create ViewModel with binding handler', function(){
            let dom = $.parse('<div><vm class:foo="VM" options="{foo: bar}" /></div>');
            let w = Widget.create({
                el: dom
            });
            expect(w.foo instanceof VM).toBe(true);
            w.foo.value = 'foo';
            expect(dom.innerText).toBe('foo');
            expect(w.foo.options.foo).toBe('bar');
        });

    });

});
